'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { useRecentlyViewed } from '@/context/recently-viewed-context';
import toast from 'react-hot-toast';
import { Spinner } from '@/components/ui/spinner';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  description: string;
  slug?: string;
}

export default function AIRecommendations({ currentProduct }: { currentProduct?: Product }) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { addItem: addToCart } = useCart();
  const { products: recentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    async function fetchRecommendations() {
      if (!recentlyViewed) return;
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) {
          setIsLoading(false);
          return;
        }

        const res = await fetch('/api/ai/recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentProductId: currentProduct?.id,
            recentlyViewedIds: recentlyViewed.map(p => p.id),
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to fetch recommendations');
        }

        const data = await res.json();
        setRecommendations(data.recommendations || []);
      } catch (error) {
        console.error('AI Recommendation error:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecommendations();
  }, [currentProduct, recentlyViewed]);

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-4">
        <Spinner size={40} />
        <p className="text-xs font-bold uppercase tracking-widest text-black/30 dark:text-white/30">AI is curating your secure collection...</p>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <section className="py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-emerald-500 rounded-xl">
          <Sparkles className="w-5 h-5 text-black" />
        </div>
        <div>
          <h2 className="text-2xl font-bold dark:text-white">AI Recommended for You</h2>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Powered by Gemini</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {recommendations.map((product) => (
          <motion.div
            key={product.id}
            whileHover={{ y: -5 }}
            className="group bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  disabled={addingId === product.id}
                  onClick={async () => {
                    setAddingId(product.id);
                    await new Promise(resolve => setTimeout(resolve, 600));
                    await addToCart({ 
                      id: product.id, 
                      name: product.name, 
                      price: product.price, 
                      image_url: product.image_url 
                    });
                    setAddingId(null);
                  }}
                  className="p-4 bg-white text-black rounded-2xl font-bold flex items-center gap-2 hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100"
                >
                  {addingId === product.id ? (
                    <Spinner size={20} />
                  ) : (
                    <ShoppingCart className="w-5 h-5" />
                  )}
                  {addingId === product.id ? 'Adding...' : 'Quick Add'}
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="font-bold text-lg dark:text-white mb-1">{product.name}</h3>
              <p className="text-xs text-black/50 dark:text-white/50 mb-4 line-clamp-2">{product.description}</p>
              <div className="flex items-center justify-between">
                <p className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">{formatCurrency(product.price)}</p>
                <Link href={`/products/${product.slug}`} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-black hover:text-white transition-all">
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
