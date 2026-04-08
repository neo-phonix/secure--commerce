'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Shield, Truck, RefreshCw, Star, ChevronRight, TrendingUp, Zap, ShoppingBag } from 'lucide-react';
import ProductCard from '@/components/product-card';
import RecentlyViewed from '@/components/recently-viewed';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/context/language-context';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  inventory_count: number;
  rating: number;
  review_count: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
  product_count: number;
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products?limit=8').then(res => res.json()),
          supabase
            .from('categories')
            .select('*')
        ]);

        if (productsRes) setFeaturedProducts(productsRes as Product[]);
        
        if (categoriesRes.data) {
          const categoriesWithCounts = await Promise.all(
            categoriesRes.data.map(async (category) => {
              const { count } = await supabase
                .from('products')
                .select('*', { count: 'exact', head: true })
                .eq('category_id', category.id);

              return {
                ...category,
                product_count: count || 0
              };
            })
          );
          setCategories(categoriesWithCounts as Category[]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  return (
    <main className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1920&h=1080"
            alt="Hero Background"
            fill
            className="object-cover opacity-60"
            priority
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/40 to-transparent" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
              <Zap className="w-3 h-3" />
              <span>{t.home.hero.badge}</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight mb-6 tracking-tight">
              {t.home.hero.title} <span className="text-emerald-400">{t.home.hero.highlight}</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-lg">
              {t.home.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/25 group"
              >
                {t.home.hero.cta_primary}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/categories"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur-md border border-white/10 transition-all duration-300"
              >
                {t.home.hero.cta_secondary}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white dark:bg-slate-950 border-y border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start space-x-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{t.home.features.secure.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.home.features.secure.desc}</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{t.home.features.delivery.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.home.features.delivery.desc}</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-500">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{t.home.features.returns.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.home.features.returns.desc}</p>
              </div>
            </div>
            <div className="flex items-start space-x-4 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 transition-all hover:shadow-md">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{t.home.features.quality.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.home.features.quality.desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mb-4">
                {t.home.categories.title}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl">
                {t.home.categories.subtitle}
              </p>
            </div>
            <Link
              href="/categories"
              className="inline-flex items-center text-emerald-500 font-semibold hover:text-emerald-600 transition-colors group"
            >
              {t.home.categories.view_all}
              <ChevronRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/products?category=${category.name}`}
                className="group relative h-80 rounded-2xl overflow-hidden"
              >
                <Image
                  src={category.image_url || `https://picsum.photos/seed/${category.name}/800/800`}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-xl font-bold text-white mb-1">{category.name}</h3>
                  <p className="text-slate-300 text-sm">{category.product_count} {t.home.categories.products_count}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-medium mb-4">
                <TrendingUp className="w-3 h-3" />
                <span>{t.home.featured.badge}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mb-4">
                {t.home.featured.title}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-xl">
                {t.home.featured.subtitle}
              </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center text-emerald-500 font-semibold hover:text-emerald-600 transition-colors group"
            >
              {t.home.featured.view_all}
              <ChevronRight className="ml-1 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {featuredProducts.length === 0 && !isLoading && (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Products Found</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8">
                It looks like your database is empty. Please contact the administrator.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-slate-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 p-8 md:p-16 lg:p-24">
            <div className="absolute inset-0 z-0">
              <Image
                src="https://picsum.photos/seed/tech/1920/1080?blur=10"
                alt="CTA Background"
                fill
                className="object-cover opacity-30"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-blue-500/20" />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto text-center">
              <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-8 leading-tight">
                {t.home.cta.title}
              </h2>
              <p className="text-xl text-slate-300 mb-12 leading-relaxed">
                {t.home.cta.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 rounded-2xl bg-white text-slate-900 font-bold hover:bg-slate-100 transition-all duration-300 shadow-xl"
                >
                  {t.home.cta.btn_signup}
                </Link>
                <Link
                  href="/products"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-5 rounded-2xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all duration-300 shadow-xl shadow-emerald-500/20"
                >
                  {t.home.cta.btn_shop}
                  <ShoppingBag className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <RecentlyViewed />
    </main>
  );
}
