'use client';

import Link from 'next/link';
import { ChevronRight, Laptop, Smartphone, Watch, Headphones, Camera, Speaker, Monitor, Cpu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/language-context';
import { createClient } from '@/lib/supabase/client';

const categoryIcons: Record<string, any> = {
  'Laptops': <Laptop className="w-8 h-8" />,
  'Smartphones': <Smartphone className="w-8 h-8" />,
  'Wearables': <Watch className="w-8 h-8" />,
  'Audio': <Headphones className="w-8 h-8" />,
  'Cameras': <Camera className="w-8 h-8" />,
  'Speakers': <Speaker className="w-8 h-8" />,
  'Monitors': <Monitor className="w-8 h-8" />,
  'Components': <Cpu className="w-8 h-8" />,
};

export default function CategoriesPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const supabase = createClient();
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        setLoading(false);
        return;
      }

      const categoriesWithCounts = await Promise.all(
        categoriesData.map(async (category) => {
          const { count } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true })
            .eq('category', category.name);

          return {
            ...category,
            product_count: count || 0
          };
        })
      );

      setCategories(categoriesWithCounts);
      setLoading(false);
    }

    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">
          <Link href="/" className="hover:text-primary transition-colors">{t.nav.home}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 dark:text-white">{t.nav.categories}</span>
        </div>

        {/* Header */}
        <div className="mb-16">
          <h1 className="text-5xl font-display font-bold mb-4 dark:text-white tracking-tight">
            {t.home.categories.title.split('Category')[0]}
            <span className="text-emerald-500">{t.nav.categories}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">{t.home.categories.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <div key={category.id}>
              <Link 
                href={`/products?category=${category.name}`}
                className="group block relative h-64 overflow-hidden rounded-[32px] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 bg-white dark:bg-slate-900"
              >
                <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#10b981,transparent)]" />
                </div>
                
                <div className="relative h-full p-8 flex flex-col justify-between">
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/5">
                    {categoryIcons[category.name] || <Laptop className="w-8 h-8" />}
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold dark:text-white mb-2">{category.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{category.description}</p>
                  </div>
                </div>
                
                <div className="absolute bottom-8 right-8 w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                  <ChevronRight className="w-5 h-5 text-slate-900 dark:text-white" />
                </div>
              </Link>
            </div>
          ))}
        </div>

        {!loading && categories.length === 0 && (
          <div className="text-center py-32 bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl font-display font-bold mb-2 dark:text-white">No categories found</h3>
            <p className="text-slate-500 dark:text-slate-400">Please contact the administrator to seed the database.</p>
          </div>
        )}
      </div>
    </div>
  );
}

