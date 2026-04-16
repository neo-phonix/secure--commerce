'use client';

import { useState, useEffect, use, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/product-card';
import { Search, Filter, Loader2, Shield, Zap, Lock, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&sort=${sortBy}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setProducts(data);
          }
        }
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchResults();
    } else {
      setLoading(false);
    }
  }, [query, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-white dark:text-black" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30">Search Results</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight dark:text-white">
            Results for &quot;<span className="text-emerald-500">{query}</span>&quot;
          </h1>
          {!loading && (
            <p className="text-sm text-black/40 dark:text-white/40 mt-2">Found {products.length} secure assets matching your criteria.</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-10 pr-10 py-3 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all text-xs font-bold cursor-pointer dark:text-white"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-[400px] bg-black/5 dark:bg-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-white dark:bg-zinc-900 rounded-[40px] border border-black/5 dark:border-white/5">
          <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Search className="w-10 h-10 text-black/10 dark:text-white/10" />
          </div>
          <h3 className="text-2xl font-bold mb-2 dark:text-white">No assets found</h3>
          <p className="text-black/40 dark:text-white/40 max-w-md mx-auto mb-8">
            We couldn&apos;t find any secure assets matching &quot;{query}&quot;. Try using more general terms or check your spelling.
          </p>
          <Link href="/" className="px-8 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold hover:scale-105 transition-all">
            Browse All Assets
          </Link>
        </div>
      )}

      {/* Security Features Bento (Reused) */}
      <section className="mt-32 pt-20 border-t border-black/5 dark:border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/5">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 dark:text-white">Instant Discovery</h3>
            <p className="text-sm text-black/50 dark:text-white/50 leading-relaxed">
              Our smart search engine indexes assets in real-time, ensuring you find the latest security hardware instantly.
            </p>
          </div>
          <div className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/5">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 dark:text-white">Verified Results</h3>
            <p className="text-sm text-black/50 dark:text-white/50 leading-relaxed">
              Every product in our search results is verified for compliance with international security standards.
            </p>
          </div>
          <div className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/5">
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center mb-6">
              <Lock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 dark:text-white">Private Search</h3>
            <p className="text-sm text-black/50 dark:text-white/50 leading-relaxed">
              Your search queries are encrypted and never shared with third parties. Your privacy is our priority.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="min-h-screen pb-20 bg-[#fafafa] dark:bg-black">
      <Suspense fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="h-12 w-64 bg-black/5 dark:bg-white/5 rounded-xl animate-pulse mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[400px] bg-black/5 dark:bg-white/5 rounded-3xl animate-pulse" />
            ))}
          </div>
        </div>
      }>
        <SearchContent />
      </Suspense>
    </div>
  );
}
