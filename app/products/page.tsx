import { createClient } from '@/lib/supabase/server';
import ProductsClient from './products-client';

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (
        name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Failed to load products. Please try again later.</p>
      </div>
    );
  }

  const mappedProducts = (products || []).map((p: any) => ({
    ...p,
    category: p.categories?.name || 'Uncategorized'
  }));

  return <ProductsClient initialProducts={mappedProducts} />;
}
