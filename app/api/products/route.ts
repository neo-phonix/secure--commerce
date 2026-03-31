import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const sort = searchParams.get('sort') || 'newest';
  const limit = parseInt(searchParams.get('limit') || '20');

  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select(`
      *,
      categories (
        name
      )
    `);

  if (category && category !== 'All') {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(category);
    if (isUuid) {
      query = query.eq('category_id', category);
    } else {
      query = query.eq('categories.name', category);
    }
  }

  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  if (sort === 'price-low') {
    query = query.order('price', { ascending: true });
  } else if (sort === 'price-high') {
    query = query.order('price', { ascending: false });
  } else if (sort === 'rating') {
    query = query.order('rating', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query.limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map the data to include category name at the top level
  const products = data?.map((p: any) => ({
    ...p,
    category: p.categories?.name || 'Uncategorized'
  }));

  return NextResponse.json(products);
}
