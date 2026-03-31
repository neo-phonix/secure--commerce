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
      .select('id, name, stock_quantity')
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

    if (product.stock_quantity < validated.quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    // Use upsert-like logic: check if item already in cart
    console.log('Checking existing item for user:', user.id, 'product:', validated.productId);
    const { data: existingItem, error: existingItemError } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', user.id)
      .eq('product_id', validated.productId)
      .maybeSingle();

    if (existingItemError) {
      console.error('Error checking existing cart item:', existingItemError);
      throw existingItemError;
    }
    console.log('Existing item found:', existingItem);

    if (existingItem) {
      const newQuantity = existingItem.quantity + validated.quantity;
      
      // Check if total quantity exceeds stock
      if (product.stock_quantity < newQuantity) {
        return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
      }

      console.log('Updating existing item:', existingItem.id, 'to new quantity:', newQuantity);
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
        .eq('id', existingItem.id);

      if (updateError) {
        console.error('Error updating cart item:', updateError);
        throw updateError;
      }
      console.log('Update successful');
    } else {
      console.log('Inserting new item for user:', user.id, 'product:', validated.productId);
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: validated.productId,
          quantity: validated.quantity,
        });

      if (insertError) {
        console.error('Error inserting cart item:', insertError);
        throw insertError;
      }
      console.log('Insert successful');
    }

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
