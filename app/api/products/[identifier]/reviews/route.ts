import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1).max(1000),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { identifier } = await params;
    const supabase = await createClient();

    // 1. Get product ID first
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    let query = supabase.from('products').select('id');
    
    if (isUuid) {
      query = query.or(`id.eq.${identifier},slug.eq.${identifier}`);
    } else {
      query = query.eq('slug', identifier);
    }

    const { data: product, error: productError } = await query.single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 2. Get reviews with profile info
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        comment,
        created_at,
        is_verified_purchase,
        user_id,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('product_id', product.id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (reviewsError) throw reviewsError;

    const formattedReviews = reviews.map((r: any) => ({
      id: r.id,
      user_name: r.profiles?.full_name || 'Anonymous User',
      avatar_url: r.profiles?.avatar_url,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      is_verified: r.is_verified_purchase,
    }));

    return NextResponse.json({ reviews: formattedReviews });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { identifier } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reviewSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ error: 'Invalid review data' }, { status: 400 });
    }

    // 1. Get product ID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    let query = supabase.from('products').select('id');
    
    if (isUuid) {
      query = query.or(`id.eq.${identifier},slug.eq.${identifier}`);
    } else {
      query = query.eq('slug', identifier);
    }

    const { data: product, error: productError } = await query.single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 2. Check if user already reviewed
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', product.id)
      .eq('user_id', user.id)
      .single();

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 400 });
    }

    // 3. Check for verified purchase
    const { data: userOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .eq('payment_status', 'paid');

    const orderIds = userOrders?.map(o => o.id) || [];
    
    let isVerified = false;
    if (orderIds.length > 0) {
      const { data: orderItem } = await supabase
        .from('order_items')
        .select('id')
        .eq('product_id', product.id)
        .in('order_id', orderIds)
        .limit(1)
        .maybeSingle();
      
      isVerified = !!orderItem;
    }

    // 4. Insert review
    const { error: insertError } = await supabase
      .from('reviews')
      .insert({
        product_id: product.id,
        user_id: user.id,
        rating: validatedData.data.rating,
        comment: validatedData.data.comment,
        status: 'approved', // Auto-approve for now
        is_verified_purchase: isVerified,
      });

    if (insertError) throw insertError;

    return NextResponse.json({ message: 'Review submitted successfully' });
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
