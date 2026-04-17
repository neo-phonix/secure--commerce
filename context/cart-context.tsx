'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './auth-context';
import { useRouter } from 'next/navigation';

interface CartItem {
  id: string; // This is the cart_item.id from DB
  productId: string;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
  description?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/cart');
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (e) {
      console.error('Failed to fetch cart', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      // For unauthenticated users, we might want to clear the state
      // or handle guest cart if requested, but the requirement says
      // unauthenticated users cannot add to cart.
      setItems([]);
    }
  }, [user, fetchCart]);

  const addItem = async (product: Product, quantity: number = 1) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      router.push('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Added ${product.name} to cart!`);
        await fetchCart();
      } else {
        console.error('CartContext: Failed to add item:', data);
        
        // Handle specific schema error for missing table
        if (data.error && data.error.includes("Could not find the table")) {
          toast.error("Database setup incomplete: Missing cart_items table. Please run the SQL schema script in Supabase.", { duration: 8000 });
        } else {
          toast.error(data.error || 'Failed to add item. Please try again.');
        }
      }
    } catch (e) {
      console.error('CartContext: Error adding item:', e);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (id: string) => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/cart/${id}`, { method: 'DELETE' });
      const data = await response.json();

      if (response.ok) {
        toast.success('Removed from cart');
        await fetchCart();
      } else {
        toast.error(data.error || 'Failed to remove item');
      }
    } catch (e) {
      toast.error('Failed to remove item');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (!user || quantity < 1) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/cart/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      const data = await response.json();

      if (response.ok) {
        await fetchCart();
      } else {
        toast.error(data.error || 'Failed to update quantity');
      }
    } catch (e) {
      toast.error('Failed to update quantity');
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await fetch('/api/cart', { method: 'DELETE' });
      const data = await response.json();

      if (response.ok) {
        toast.success('Cart cleared');
        await fetchCart();
      } else {
        toast.error(data.error || 'Failed to clear cart');
      }
    } catch (e) {
      toast.error('Failed to clear cart');
    } finally {
      setLoading(false);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, loading }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
