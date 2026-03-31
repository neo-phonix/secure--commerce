import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Supabase configuration is missing. Please check your environment variables.' 
      }, { status: 500 });
    }

    const { identifier } = await params;
    const supabase = await createClient();

    // Validate identifier format (UUID or slug)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    const isSlug = /^[a-z0-9-]+$/.test(identifier);

    if (!isUuid && !isSlug) {
      return NextResponse.json({ error: 'Invalid product identifier' }, { status: 400 });
    }

    let query = supabase
      .from('products')
      .select(`
        *,
        categories (
          name
        )
      `);

    if (isUuid) {
      query = query.eq('id', identifier);
    } else {
      query = query.eq('slug', identifier);
    }

    const { data: product, error } = await query.single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      console.error('Supabase error fetching product:', error);
      return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }

    // Map the data to include category name at the top level
    const mappedProduct = {
      ...product,
      category: product.categories?.name || 'Uncategorized'
    };

    return NextResponse.json(mappedProduct);
  } catch (error: any) {
    console.error('Product fetch failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
