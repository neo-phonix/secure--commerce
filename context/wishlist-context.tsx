'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { toast } from 'react-hot-toast';

interface WishlistItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  image_url: string;
  slug?: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  addItem: (product: any) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      const saved = localStorage.getItem('wishlist');
      if (saved) {
        setItems(JSON.parse(saved));
      }
      setLoading(false);
    }
  }, [user]);

  const fetchWishlist = async () => {
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error('Failed to fetch wishlist', e);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (product: any) => {
    if (user) {
      try {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: product.id }),
        });
        if (res.ok) {
          fetchWishlist();
          toast.success('Added to wishlist');
        }
      } catch (e) {
        toast.error('Failed to add to wishlist');
      }
    } else {
      setItems((prev) => {
        const exists = prev.find((item) => item.product_id === product.id);
        if (exists) return prev;
        const newItems = [...prev, { id: Math.random().toString(), product_id: product.id, ...product }];
        localStorage.setItem('wishlist', JSON.stringify(newItems));
        toast.success('Added to wishlist');
        return newItems;
      });
    }
  };

  const removeItem = async (productId: string) => {
    if (user) {
      try {
        const res = await fetch(`/api/wishlist/${productId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchWishlist();
          toast.success('Removed from wishlist');
        }
      } catch (e) {
        toast.error('Failed to remove from wishlist');
      }
    } else {
      setItems((prev) => {
        const newItems = prev.filter((item) => item.product_id !== productId);
        localStorage.setItem('wishlist', JSON.stringify(newItems));
        toast.success('Removed from wishlist');
        return newItems;
      });
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some((item) => item.product_id === productId);
  };

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem, isInWishlist, loading }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
