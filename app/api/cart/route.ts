import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import rateLimit from '@/lib/rate-limit';
import { z } from 'zod';

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
  strict: false,
});

const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        product:products (
          id,
          name,
          price,
          image_url
        )
      `)
      .eq('user_id', user.id);

    if (error) throw error;

    // Flatten the response and handle missing products safely
    const cartItems = data
      .filter((item: any) => item.product !== null) // Skip items where product was deleted
      .map((item: any) => ({
        id: item.id,
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        image_url: item.product.image_url,
        quantity: item.quantity,
      }));

    return NextResponse.json(cartItems);
  } catch (error) {
    console.error('Cart GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('Cart POST User:', user?.id, userError);

    if (!user) {
      console.error('Cart POST: Unauthorized:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    try {
      await limiter.check(50, `cart_add_${user.id}`); // Relaxed from 20 to 50
    } catch {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await req.json();
    console.log('Cart POST Body:', body);
    const validated = addToCartSchema.parse(body);
    console.log('Cart POST Validated:', validated);

    // Check if product exists and has stock
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', validated.productId)
      .single();

    if (productError || !product) {
      console.error('Cart POST: Product not found or error:', {
        productId: validated.productId,
        error: productError,
        data: product
      });
      return NextResponse.json({ 
        error: productError ? `Database error: ${productError.message}` : 'Product not found',
        productId: validated.productId,
        details: productError
      }, { status: 404 });
    }

    // Determine stock count column (handle both legacy and new schema, and handle nulls)
    const stockCount = (product.inventory_count !== undefined && product.inventory_count !== null) 
      ? product.inventory_count 
      : (product.stock_quantity !== undefined && product.stock_quantity !== null ? product.stock_quantity : 0);
    
    console.log('Cart POST: Product found:', { 
      id: product.id, 
      inventory_count: product.inventory_count, 
      stock_quantity: product.stock_quantity,
      resolvedStock: stockCount
    });

    if (stockCount < validated.quantity) {
      console.error('Cart POST: Insufficient stock:', { stockCount, requested: validated.quantity });
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    // Use upsert logic to handle both insert and update atomically
    console.log('Cart POST: Attempting upsert for user:', user.id, 'product:', validated.productId);
    
    // First, check if item already exists to calculate new quantity for stock check
    const { data: existingItem, error: existingItemError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', validated.productId)
      .maybeSingle();

    if (existingItemError) {
      console.error('Cart POST: Error checking existing cart item:', existingItemError);
      throw existingItemError;
    }

    const newQuantity = existingItem ? existingItem.quantity + validated.quantity : validated.quantity;
    console.log('Cart POST: Calculated new quantity:', newQuantity, 'Existing:', existingItem?.quantity);

    // Check if total quantity exceeds stock
    if (stockCount < newQuantity) {
      console.error('Cart POST: Insufficient stock for update:', { stockCount, requested: newQuantity });
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    const { data: upsertData, error: upsertError } = await supabase
      .from('cart_items')
      .upsert({
        user_id: user.id,
        product_id: validated.productId,
        quantity: newQuantity,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'user_id,product_id' 
      })
      .select();

    if (upsertError) {
      console.error('Cart POST: Upsert Error:', upsertError);
      // If upsert fails, try manual insert/update as fallback
      if (existingItem) {
        console.log('Cart POST: Falling back to update');
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq('id', existingItem.id);
        if (updateError) throw updateError;
      } else {
        console.log('Cart POST: Falling back to insert');
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: validated.productId,
            quantity: validated.quantity,
          });
        if (insertError) throw insertError;
      }
    }

    console.log('Cart POST: Success', upsertData);
    return NextResponse.json({ message: 'Item added to cart' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    console.error('Cart POST Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal Server Error',
      details: error
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Cart DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
