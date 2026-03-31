'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRecentlyViewed } from '@/context/recently-viewed-context';
import { useLanguage } from '@/context/language-context';
import { ChevronRight, History } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function RecentlyViewed() {
  const { products } = useRecentlyViewed();
  const { t } = useLanguage();

  if (products.length === 0) return null;

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <History className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white">{t.recently_viewed.title}</h2>
          </div>
          <Link 
            href="/products" 
            className="text-sm font-semibold text-emerald-500 hover:text-emerald-600 transition-colors flex items-center group"
          >
            {t.recently_viewed.cta}
            <ChevronRight className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 transition-all hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-4">
                <Image
                  src={product.image_url || `https://picsum.photos/seed/${product.id}/800/800`}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 mb-1 group-hover:text-emerald-500 transition-colors">
                {product.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{product.category}</p>
              <p className="font-bold text-emerald-500">{formatCurrency(product.price)}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
