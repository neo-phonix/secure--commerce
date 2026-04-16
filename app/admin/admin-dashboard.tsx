'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Settings, 
  Bell, 
  Search,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';
import { Spinner } from '@/components/ui/spinner';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeUsers: 0,
    totalOrders: 0,
    conversionRate: 3.42, // Mocked for now
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const supabase = createClient();

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const data = await response.json();
      
      if (data.stats) setStats(data.stats);
      if (Array.isArray(data.recentOrders)) setRecentOrders(data.recentOrders);
      if (Array.isArray(data.chartData)) setChartData(data.chartData);
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      fetchAdminData();
    }
  }, [authLoading, fetchAdminData]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Spinner size={40} />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-4">Initializing Secure Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">System Administrator</span>
            </div>
            <h1 className="text-4xl font-display font-bold dark:text-white tracking-tight">Admin Command Center</h1>
            <p className="text-slate-500 dark:text-slate-400">Real-time overview of your secure ecosystem.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search analytics..."
                className="pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm dark:text-white w-64"
              />
            </div>
            <button className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-500 hover:text-primary transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard title="Total Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} change="+12.5%" icon={DollarSign} color="indigo" />
          <StatCard title="Active Users" value={stats.activeUsers.toLocaleString()} change="+5.2%" icon={Users} color="emerald" />
          <StatCard title="Total Orders" value={stats.totalOrders.toLocaleString()} change="-2.4%" icon={ShoppingBag} color="blue" />
          <StatCard title="Conversion Rate" value={`${stats.conversionRate}%`} change="+1.2%" icon={TrendingUp} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 glass p-8 rounded-[40px] shadow-xl shadow-black/5 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-display font-bold dark:text-white">Sales Performance</h2>
              <select className="bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 outline-none">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-1 glass p-8 rounded-[40px] shadow-xl shadow-black/5 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-display font-bold dark:text-white">Recent Orders</h2>
              <button className="text-xs font-bold text-primary uppercase tracking-widest hover:underline">View All</button>
            </div>
            <div className="space-y-6">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                      </div>
                      <div className="max-w-[120px]">
                        <p className="text-sm font-bold dark:text-white truncate">{order.profiles?.full_name || 'Guest'}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest truncate">{order.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">${Number(order.final_amount).toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 text-sm">No orders found yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon, color }: any) {
  const isPositive = change.startsWith('+');
  
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass p-6 rounded-[32px] shadow-xl shadow-black/5 border border-slate-100 dark:border-slate-800"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-${color}-500/10 text-${color}-500`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}
        </div>
      </div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-2xl font-display font-bold dark:text-white">{value}</h3>
    </motion.div>
  );
}
