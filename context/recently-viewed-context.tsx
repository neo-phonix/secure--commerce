'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  category?: string;
  slug?: string;
}

interface RecentlyViewedContextType {
  products: Product[];
  addProduct: (product: Product) => void;
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType | undefined>(undefined);

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('recently-viewed');
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recently viewed', e);
      }
    }
  }, []);

  const addProduct = (product: Product) => {
    setProducts((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      const newProducts = [product, ...filtered].slice(0, 10);
      localStorage.setItem('recently-viewed', JSON.stringify(newProducts));
      return newProducts;
    });
  };

  return (
    <RecentlyViewedContext.Provider value={{ products, addProduct }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export const useRecentlyViewed = () => {
  const context = useContext(RecentlyViewedContext);
  if (context === undefined) {
    throw new Error('useRecentlyViewed must be used within a RecentlyViewedProvider');
  }
  return context;
};
