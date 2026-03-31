'use client';

import { useCart } from '@/context/cart-context';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, ShieldCheck, Lock, Truck, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';

export default function CartPage() {
  const { items: cart, removeItem: removeFromCart, updateQuantity, clearCart } = useCart();

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = subtotal > 5000 ? 0 : 250;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 pt-24">
        <div className="max-w-7xl mx-auto px-4 py-32 text-center">
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600" />
          </div>
          <h1 className="text-4xl font-display font-bold mb-4 dark:text-white">Your cart is empty</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-12 max-w-md mx-auto">
            Looks like you haven&apos;t added any premium hardware to your cart yet.
          </p>
          <Link 
            href="/products" 
            className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-primary/20"
          >
            Start Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-12">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 dark:text-white">Shopping Cart</span>
        </div>

        <h1 className="text-4xl font-display font-bold mb-12 dark:text-white tracking-tight">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="popLayout">
              {cart.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass p-6 rounded-[32px] flex flex-col sm:flex-row items-center gap-6 shadow-xl shadow-black/5 border border-slate-100 dark:border-slate-800"
                >
                  <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900 flex-shrink-0">
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-grow text-center sm:text-left">
                    <h3 className="text-lg font-bold dark:text-white mb-1">{item.name}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Premium Hardware</p>
                    <div className="flex items-center justify-center sm:justify-start gap-4">
                      <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                        <button 
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="p-2 text-slate-500 hover:text-primary transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-bold text-sm dark:text-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 text-slate-500 hover:text-primary transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-3 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-800 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-display font-bold text-primary">{formatCurrency(item.price * item.quantity)}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{formatCurrency(item.price)} each</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button 
              onClick={() => clearCart()}
              className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors flex items-center gap-2 ml-auto p-4"
            >
              <Trash2 className="w-4 h-4" />
              Clear Shopping Cart
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="glass p-8 rounded-[40px] sticky top-32 shadow-2xl shadow-black/5 border border-slate-100 dark:border-slate-800">
              <h2 className="text-2xl font-display font-bold mb-8 dark:text-white">Order Summary</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                  <span className="font-bold dark:text-white">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Shipping</span>
                  <span className="font-bold text-accent">{shipping === 0 ? 'FREE' : formatCurrency(shipping)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Estimated Tax (GST 18%)</span>
                  <span className="font-bold dark:text-white">{formatCurrency(tax)}</span>
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                  <span className="text-lg font-bold dark:text-white">Total</span>
                  <span className="text-2xl font-display font-bold text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              <Link 
                href="/checkout"
                className="w-full py-5 bg-primary text-white rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-primary/30 mb-6"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                  Secure SSL Encrypted Checkout
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Lock className="w-4 h-4 text-primary" />
                  Zero-Knowledge Data Protection
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Truck className="w-4 h-4 text-blue-500" />
                  Free Express Shipping on {formatCurrency(5000)}+
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
