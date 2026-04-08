import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateQuantitySchema = z.object({
  quantity: z.number().int().positive(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Validate ID as UUID
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validated = updateQuantitySchema.parse(body);

    // Verify ownership and update
    const { data: item, error: fetchError } = await supabase
      .from('cart_items')
      .select('id, product_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check stock
    const { data: product } = await supabase
      .from('products')
      .select('inventory_count')
      .eq('id', item.product_id)
      .single();

    if (product && product.inventory_count < validated.quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity: validated.quantity, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ message: 'Quantity updated' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    console.error('Cart PATCH Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Validate ID as UUID
    if (!z.string().uuid().safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if item exists and belongs to user first
    const { data: item, error: fetchError } = await supabase
      .from('cart_items')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ message: 'Item removed' });
  } catch (error) {
    console.error('Cart DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
