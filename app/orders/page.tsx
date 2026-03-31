'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { Package, ChevronRight, Clock, ShieldCheck, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { handleFirestoreError, OperationType } from '@/lib/error-handler';
import { formatCurrency } from '@/lib/utils';

interface OrderItem {
  id: string;
  quantity: number;
  price_at_purchase: number;
  products: {
    name: string;
    image_url: string;
    slug: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  final_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  order_items: OrderItem[];
}

import { Skeleton } from '@/components/ui/skeleton';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        setOrders(data.orders || []);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, '/api/orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4 dark:text-white">Please login to view your orders</h1>
          <Link href="/login" className="inline-block px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-[#fafafa] dark:bg-zinc-950 pt-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-12">
          <Link href="/" className="hover:text-primary transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 dark:text-white">Order History</span>
        </div>

        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2 dark:text-white">Order History</h1>
            <p className="text-black/50 dark:text-white/50 text-sm">Review and track your secure transactions.</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/30">
            <ShieldCheck className="w-4 h-4" />
            Verified Secure
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-3xl border border-black/5 dark:border-white/5" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/5">
            <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-8 h-8 text-black/20 dark:text-white/20" />
            </div>
            <h2 className="text-xl font-bold mb-2 dark:text-white">No orders yet</h2>
            <p className="text-black/50 dark:text-white/50 mb-8">Your secure purchase history will appear here.</p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold hover:bg-black/80 transition-colors">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => (
              <motion.div 
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6 sm:p-8 border-b border-black/5 dark:border-white/5 bg-[#fcfcfc] dark:bg-zinc-900/50 flex flex-wrap gap-6 justify-between items-center">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30 mb-1">Order Placed</p>
                      <p className="text-sm font-bold dark:text-white">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30 mb-1">Total Amount</p>
                      <p className="text-sm font-bold font-mono dark:text-white">{formatCurrency(order.final_amount)}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30 mb-1">Status</p>
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tighter ${
                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-[10px] font-mono text-black/30 dark:text-white/30">ID: {order.id.slice(0, 8)}...</p>
                    <button className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
                      <ExternalLink className="w-4 h-4 text-black/50 dark:text-white/50" />
                    </button>
                  </div>
                </div>

                <div className="p-6 sm:p-8">
                  <div className="space-y-6">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex gap-6 items-center">
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-zinc-800 border border-black/5 dark:border-white/5 flex-shrink-0">
                          <Image 
                            src={item.products.image_url} 
                            alt={item.products.name} 
                            fill 
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex-grow">
                          <h4 className="font-bold text-sm mb-1 dark:text-white">{item.products.name}</h4>
                          <p className="text-xs text-black/50 dark:text-white/50">Qty: {item.quantity} • {formatCurrency(item.price_at_purchase)} each</p>
                        </div>
                        <Link 
                          href={`/products/${item.products.slug}`}
                          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <ChevronRight className="w-4 h-4 text-black/30 dark:text-white/30" />
                        </Link>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 text-xs text-black/40 dark:text-white/40">
                      <Clock className="w-4 h-4" />
                      Paid via {order.payment_method.toUpperCase()}
                    </div>
                    <div className="flex gap-3">
                      <button className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold hover:bg-black/80 dark:hover:bg-zinc-200 transition-colors">
                        Track Order
                      </button>
                      <button className="px-4 py-2 bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-xl text-xs font-bold hover:bg-black/5 dark:hover:bg-white/5 transition-colors dark:text-white">
                        Buy Again
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
