'use client';

import { useWishlist } from '@/context/wishlist-context';
import { useCart } from '@/context/cart-context';
import { Heart, ShoppingCart, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Spinner } from '@/components/ui/spinner';

export default function WishlistPage() {
  const { items, removeItem: removeFromWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleMoveToCart = async (item: any) => {
    setAddingId(item.id);
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const productId = item.product_id || item.id;
    await addToCart({ ...item, id: productId }, 1);
    await removeFromWishlist(productId);
    setAddingId(null);
  };

  return (
    <div className="min-h-screen pb-20 bg-[#fafafa] dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 dark:text-white">Your Wishlist</h1>
            <p className="text-black/50 dark:text-white/50 text-sm">Save your favorite items for later.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 rounded-full text-xs font-bold uppercase tracking-widest border border-pink-100 dark:border-pink-900/30">
            <Heart className="w-4 h-4 fill-current" />
            {items.length} Items Saved
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/5">
            <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-black/20 dark:text-white/20" />
            </div>
            <h2 className="text-xl font-bold mb-2 dark:text-white">Your wishlist is empty</h2>
            <p className="text-black/50 dark:text-white/50 mb-8">Start exploring and save items you love.</p>
            <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold hover:scale-105 transition-all">
              Explore Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden hover:shadow-xl transition-all duration-500"
              >
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="absolute top-4 right-4 p-3 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-xl text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg dark:text-white mb-1">{item.name}</h3>
                      <p className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">${item.price.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleMoveToCart(item)}
                      disabled={addingId === item.id}
                      className="flex-grow py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {addingId === item.id ? (
                        <>
                          <Spinner size={16} className="text-white dark:text-black" />
                          Moving...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          Add to Cart
                        </>
                      )}
                    </button>
                    <Link
                      href={`/products/${item.slug || item.id}`}
                      className="p-3 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-20 p-8 bg-black dark:bg-white rounded-3xl text-white dark:text-black flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 dark:bg-black/10 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Secure Wishlist</h3>
              <p className="text-white/50 dark:text-black/50 text-sm">Your saved items are encrypted and synced across devices.</p>
            </div>
          </div>
          <button className="px-8 py-4 bg-emerald-500 text-black rounded-2xl font-bold hover:scale-105 transition-all">
            Share Wishlist
          </button>
        </div>
      </div>
    </div>
  );
}
