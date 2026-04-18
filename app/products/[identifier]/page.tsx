'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { useRecentlyViewed } from '@/context/recently-viewed-context';
import { useAuth } from '@/context/auth-context';
import { Star, ShieldCheck, ShoppingCart, Heart, ArrowLeft, Truck, RefreshCw, Lock, ChevronRight, Minus, Plus, Share2, Info, LogIn, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import AIRecommendations from '@/components/ai-recommendations';
import Reviews from '@/components/reviews';
import RecentlyViewed from '@/components/recently-viewed';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency, cn } from '@/lib/utils';

export default function ProductDetailPage({ params }: { params: Promise<{ identifier: string }> }) {
  const { identifier } = use(params);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'adding' | 'added'>('idle');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const { addItem: addToCart } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { addProduct } = useRecentlyViewed();
  const { user } = useAuth();
  const router = useRouter();

  const fetchProduct = useCallback(async () => {
    try {
      const res = await fetch(`/api/products/${identifier}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data);
        addProduct({
          id: data.id,
          name: data.name,
          price: data.price,
          image_url: data.image_url,
          slug: data.slug
        });
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  }, [identifier, addProduct]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = async () => {
    setStatus('adding');
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 600));
    
    await addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url
    }, quantity);
    
    setStatus('added');
    setTimeout(() => setStatus('idle'), 2500);
  };

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
      <Spinner size={40} className="text-primary" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4 dark:text-white">Product not found</h1>
      <Link href="/products" className="text-primary font-bold uppercase tracking-widest text-sm">Back to Shop</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-12">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/products" className="hover:text-primary transition-colors">Products</Link>
          {product.category && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-slate-400">{product.category}</span>
            </>
          )}
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 dark:text-white truncate max-w-[200px]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="relative aspect-square rounded-[40px] overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                className="object-cover hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(product)}
                className={`absolute top-6 right-6 p-4 rounded-2xl backdrop-blur-md border transition-all duration-300 ${
                  isInWishlist(product.id)
                    ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'
                    : 'bg-white/10 border-white/20 text-white hover:bg-white hover:text-red-500'
                }`}
              >
                <Heart className={`w-6 h-6 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
              </button>
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full border border-primary/20">
                  {product.category || 'Premium'}
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className={`w-3 h-3 ${i <= (product.rating || 5) ? 'text-yellow-500 fill-current' : 'text-slate-300'}`} />
                  ))}
                  <span className="text-xs font-bold text-slate-500 ml-2">({product.review_count || 0} Reviews)</span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 dark:text-white tracking-tight leading-tight">
                {product.name}
              </h1>
              
              <div className="flex items-center gap-4 mb-8">
                <span className="text-4xl font-display font-bold text-primary">{formatCurrency(product.price)}</span>
                <span className={cn(
                  "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border",
                  product.inventory_count > 0 
                    ? "bg-accent/10 text-accent border-accent/20" 
                    : "bg-red-500/10 text-red-500 border-red-500/20"
                )}>
                  {product.inventory_count > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              <p className="text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                {product.description}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-6">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 border border-slate-200 dark:border-slate-700">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 text-slate-500 hover:text-primary transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold dark:text-white">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-3 text-slate-500 hover:text-primary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={user ? handleAddToCart : () => router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`)}
                  disabled={status !== 'idle' || product.inventory_count === 0}
                  className={cn(
                    "flex-grow py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed",
                    user 
                      ? status === 'added'
                        ? "bg-green-600 text-white shadow-lg shadow-green-600/30 scale-[1.02]"
                        : "bg-primary text-white shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]" 
                      : "bg-slate-900 text-white shadow-2xl shadow-slate-900/30 hover:scale-[1.02] active:scale-[0.98]"
                  )}
                >
                  {status === 'adding' ? (
                    <>
                      <Spinner size={20} className="text-white" />
                      Adding...
                    </>
                  ) : status === 'added' ? (
                    <>
                      <Check className="w-5 h-5 animate-in zoom-in duration-300" />
                      Added to Cart
                    </>
                  ) : user ? (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Login to Add to Cart
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Shipping</p>
                  <p className="text-xs font-bold dark:text-white">Free Express</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security</p>
                  <p className="text-xs font-bold dark:text-white">SSL Encrypted</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Returns</p>
                  <p className="text-xs font-bold dark:text-white">30-Day Guarantee</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Privacy</p>
                  <p className="text-xs font-bold dark:text-white">Zero-Data Leak</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs Section */}
        <div className="mb-24">
          <div className="flex items-center gap-12 border-b border-slate-100 dark:border-slate-800 mb-12">
            {['description', 'specifications', 'security'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-6 text-sm font-bold uppercase tracking-widest transition-all relative ${
                  activeTab === tab ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              {activeTab === 'description' && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="prose prose-slate dark:prose-invert max-w-none"
                >
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg">
                    {product.description}
                  </p>
                  <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 mb-4">
                        <Info className="w-5 h-5 text-primary" />
                        <h4 className="font-bold dark:text-white">Product Overview</h4>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        This enterprise-grade security asset is designed for high-stakes environments where data integrity and privacy are paramount. Built using military-grade components and hardened against physical and digital tampering.
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 mb-4">
                        <ShieldCheck className="w-5 h-5 text-accent" />
                        <h4 className="font-bold dark:text-white">Security Advisory</h4>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                        Always ensure your firmware is up to date. This product includes a lifetime subscription to our security patch network.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'specifications' && (
                <motion.div
                  key="specifications"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  {[
                    { label: 'Model', value: 'CS-X1-2024' },
                    { label: 'Encryption', value: 'AES-256 Hardware' },
                    { label: 'Certification', value: 'FIPS 140-2 Level 3' },
                    { label: 'Interface', value: 'USB-C / NFC' },
                    { label: 'Material', value: 'Titanium Alloy' },
                    { label: 'Weight', value: '45g' }
                  ].map((spec) => (
                    <div key={spec.label} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{spec.label}</span>
                      <span className="text-sm font-bold dark:text-white">{spec.value}</span>
                    </div>
                  ))}
                </motion.div>
              )}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <ul className="space-y-4">
                    {[
                      'Military-grade hardware encryption',
                      'Futuristic ergonomic design',
                      'Seamless integration with modern ecosystems',
                      'Tamper-evident physical casing',
                      'Secure boot and firmware verification'
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <CheckCircle2 className="w-5 h-5 text-accent" />
                        <span className="text-sm font-medium dark:text-white">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-24">
          <Reviews productId={product.id} />
        </div>

        {/* AI Recommendations */}
        <AIRecommendations currentProduct={product} />

        {/* Recently Viewed */}
        <RecentlyViewed />
      </div>
    </div>
  );
}

function CheckCircle2({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
