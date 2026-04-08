'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Heart, Star, Eye, ShieldCheck, LogIn } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { useRecentlyViewed } from '@/context/recently-viewed-context';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';
import { cn, formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

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

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem: addToCart } = useCart();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlist();
  const { addProduct: addToRecentlyViewed } = useRecentlyViewed();
  const { t } = useLanguage();
  const { user } = useAuth();
  const router = useRouter();

  const isWishlisted = isInWishlist(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      addToCart(product);
    } else {
      router.push(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
    }
  };

  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:-translate-y-1">
      <Link 
        href={`/products/${product.id}`}
        onClick={() => addToRecentlyViewed(product)}
        className="block relative aspect-square overflow-hidden"
      >
        <Image
          src={product.image_url || `https://picsum.photos/seed/${product.id}/800/800`}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {product.inventory_count < 5 && product.inventory_count > 0 && (
            <span className="px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
              {t.product.low_stock}
            </span>
          )}
          {product.inventory_count === 0 && (
            <span className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
              {t.product.out_of_stock}
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={handleWishlistClick}
            className={cn(
              "p-2 rounded-xl backdrop-blur-md border transition-all duration-300",
              isWishlisted 
                ? "bg-red-500 border-red-500 text-white" 
                : "bg-white/80 dark:bg-slate-900/80 border-white/20 text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white"
            )}
          >
            <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
          </button>
          <button className="p-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/20 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition-all duration-300">
            <Eye className="w-5 h-5" />
          </button>
        </div>

        {/* Add to Cart Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={handleAddToCart}
            disabled={product.inventory_count === 0}
            className={cn(
              "w-full py-3 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors",
              user 
                ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" 
                : "bg-slate-900 hover:bg-black shadow-slate-900/20"
            )}
          >
            {user ? (
              <>
                <ShoppingCart className="w-4 h-4" />
                {t.product.add_to_cart}
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Login to Add
              </>
            )}
          </button>
        </div>
      </Link>

      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{product.category}</span>
          <div className="flex items-center space-x-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{product.rating}</span>
          </div>
        </div>
        
        <Link 
          href={`/products/${product.id}`}
          onClick={() => addToRecentlyViewed(product)}
          className="block mb-2"
        >
          <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-500 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 h-8">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(product.price)}</span>
          </div>
          <div className="flex items-center text-[10px] text-slate-400 font-medium">
            <ShieldCheck className="w-3 h-3 mr-1 text-emerald-500" />
            {t.product.secure}
          </div>
        </div>
      </div>
    </div>
  );
}
