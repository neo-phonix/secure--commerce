import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
  strict: false,
});

let razorpayInstance: Razorpay | null = null;
const getRazorpay = () => {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error('Razorpay keys are missing');
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
};

const checkoutSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  couponCode: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    try {
      await limiter.check(5, `checkout_${user.id}`); // 5 requests per minute
    } catch (err) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const validatedData = checkoutSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const { items, couponCode } = validatedData.data;

    // 1. Fetch real prices from DB
    const productIds = items.map(item => item.id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, price')
      .in('id', productIds);

    if (productsError || !products) {
      return NextResponse.json({ error: 'Failed to verify products' }, { status: 400 });
    }

    // 2. Calculate totals
    let subtotal = 0;
    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 400 });
      subtotal += Number(product.price) * item.quantity;
    }

    // 3. Handle Coupon
    let discountAmount = 0;
    if (couponCode) {
      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (coupon) {
        const now = new Date();
        const expiryDate = coupon.expiry_date ? new Date(coupon.expiry_date) : null;
        
        if ((!expiryDate || expiryDate > now) && subtotal >= Number(coupon.min_purchase_amount)) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotal * Number(coupon.discount_value)) / 100;
          } else {
            discountAmount = Number(coupon.discount_value);
          }
        }
      }
    }

    const finalAmount = Math.max(0, subtotal - discountAmount);
    
    // Razorpay expects amounts in smallest currency unit (paise for INR, cents for USD)
    // Assuming USD for consistency with previous Stripe implementation, but Razorpay is often INR.
    // We'll use cents/paise.
    const amountInSmallestUnit = Math.round(finalAmount * 100);

    // 4. Create Razorpay Order
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountInSmallestUnit,
      currency: 'INR',
      receipt: `receipt_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        userId: user.id,
        items: JSON.stringify(items),
        couponCode: couponCode || '',
        ip: request.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    // Log the attempt for security auditing
    const { logAction } = await import('@/lib/audit');
    await logAction('create_payment_order', 'payment', order.id, user.id, {
      amount: finalAmount,
      itemCount: items.length
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Razorpay error:', error);
    return NextResponse.json({ error: 'Failed to create Razorpay order' }, { status: 500 });
  }
}
