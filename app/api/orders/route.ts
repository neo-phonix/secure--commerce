import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const orderSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    quantity: z.number().int().positive(),
    variant: z.any().optional(),
  })).min(1),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    address: z.string().min(5),
    city: z.string().min(2),
    postalCode: z.string().min(3),
    country: z.string().min(2),
  }),
  paymentMethod: z.string().optional(),
  couponCode: z.string().optional(),
  paymentIntentId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
  razorpaySignature: z.string().optional(),
});

import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance: Razorpay | null = null;
const getRazorpay = () => {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return null;
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
};

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'super_admin';

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            name,
            image_url,
            slug
          )
        )
      `)
      .order('created_at', { ascending: false });

    // If not admin, only show own orders
    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data: orders, error } = await query;
    
    if (error) {
      console.error('Supabase error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = orderSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const { items, shippingAddress, paymentMethod, couponCode, razorpayOrderId, razorpayPaymentId, razorpaySignature } = validatedData.data;
    
    // 0. Idempotency Check (Prevent Duplicate Orders)
    if (razorpayPaymentId) {
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('payment_provider_payment_id', razorpayPaymentId)
        .single();
      
      if (existingOrder) {
        return NextResponse.json({ message: 'Order already processed', orderId: existingOrder.id });
      }
    }

    let verifiedAmount = 0;

    // 0. Verify Payment
    if (razorpayOrderId && razorpayPaymentId && razorpaySignature) {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 });
      
      const body = razorpayOrderId + "|" + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
      }

      const razorpay = getRazorpay();
      if (!razorpay) return NextResponse.json({ error: 'Payment configuration error' }, { status: 500 });
      const order = await razorpay.orders.fetch(razorpayOrderId);
      verifiedAmount = order.amount as number;
    } else {
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // 1. Fetch real prices from DB (Prevent Price Manipulation)
    const productIds = items.map(item => item.id);
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    if (productsError || !products) {
      return NextResponse.json({ error: 'Product verification failed' }, { status: 400 });
    }

    // 2. Calculate totals on server
    let subtotal = 0;
    const orderItemsToInsert = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 400 });
      }
      
      // Determine stock count column (handle both legacy and new schema, and handle nulls)
      const stockCount = (product.inventory_count !== undefined && product.inventory_count !== null) 
        ? product.inventory_count 
        : (product.stock_quantity !== undefined && product.stock_quantity !== null ? product.stock_quantity : 0);

      if (stockCount < item.quantity) {
        return NextResponse.json({ error: `Product ${product.name || item.id} out of stock` }, { status: 400 });
      }

      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;

      orderItemsToInsert.push({
        product_id: item.id,
        quantity: item.quantity,
        price_at_purchase: product.price,
        variant_info: item.variant
      });
    }

    // 3. Handle Coupon (Server-side validation)
    let discountAmount = 0;
    let couponId = null;

    if (couponCode) {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .single();

      if (!couponError && coupon) {
        const now = new Date();
        const expiryDate = coupon.expiry_date ? new Date(coupon.expiry_date) : null;

        if ((!expiryDate || expiryDate > now) && subtotal >= Number(coupon.min_purchase_amount)) {
          if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotal * Number(coupon.discount_value)) / 100;
          } else {
            discountAmount = Number(coupon.discount_value);
          }
          couponId = coupon.id;
        }
      }
    }

    const finalAmount = Math.max(0, subtotal - discountAmount);
    
    // 3.5 Fraud Detection
    const { detectFraud } = await import('@/lib/security');
    
    // Fetch recent orders for rapid order detection
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

    const fraudResult = await detectFraud('order', {
      amount: finalAmount,
      userId: user.id,
      email: user.email,
      recentOrdersCount: recentOrders?.length || 0,
      itemsCount: items.length,
      paymentMethod
    });

    // Verify amount matches Payment Provider
    if (Math.round(finalAmount * 100) !== verifiedAmount) {
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
    }

    // 4. Create order securely using RPC (handles inventory atomically)
    const { data: orderId, error: rpcError } = await supabase.rpc('create_order_securely', {
      p_user_id: user.id,
      p_total_amount: subtotal,
      p_final_amount: finalAmount,
      p_discount_amount: discountAmount,
      p_coupon_id: couponId,
      p_payment_method: paymentMethod || 'razorpay',
      p_payment_provider_order_id: razorpayOrderId,
      p_payment_provider_payment_id: razorpayPaymentId,
      p_shipping_address: shippingAddress,
      p_items: orderItemsToInsert,
      p_fraud_risk_score: fraudResult.riskScore,
      p_fraud_risk_level: fraudResult.riskLevel
    });

    if (rpcError) {
      console.error('RPC error creating order:', rpcError);
      return NextResponse.json({ error: 'Order processing failed' }, { status: 500 });
    }

    // Log order creation
    const { logAction } = await import('@/lib/audit');
    await logAction('create_order', 'order', orderId, undefined, { total: finalAmount });

    return NextResponse.json({ message: 'Order created successfully', orderId });
  } catch (error) {
    console.error('Order creation failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
