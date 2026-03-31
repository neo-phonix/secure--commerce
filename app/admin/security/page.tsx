'use client';

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, Search, Filter, RefreshCw, Eye, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  status: 'new' | 'reviewed' | 'resolved';
  created_at: string;
}

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  user_id: string;
  severity: string;
  details: any;
  created_at: string;
}

export default function SecurityDashboard() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/security');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAlerts(data.alerts || []);
      setAuditLogs(data.auditLogs || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch security data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateAlertStatus = async (id: string, status: string) => {
    try {
      const res = await fetch('/api/admin/security', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: data.alert.status } : a));
      toast.success(`Alert marked as ${status}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update alert');
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || alert.status === filter;
    const matchesSearch = alert.type.toLowerCase().includes(search.toLowerCase()) || 
                         JSON.stringify(alert.details).toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Shield className="text-emerald-500 w-8 h-8" />
            Security & Fraud Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor security events, fraud risks, and audit logs.</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
        >
          <RefreshCw size={16} className={cn(loading && "animate-spin")} />
          Refresh Data
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="text-red-500" size={20} />
            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{alerts.filter(a => a.status === 'new').length}</p>
          <p className="text-sm text-slate-500">New Alerts</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Shield className="text-emerald-500" size={20} />
            <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Safe</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{alerts.filter(a => a.status === 'resolved').length}</p>
          <p className="text-sm text-slate-500">Resolved Issues</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Clock className="text-blue-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{auditLogs.length}</p>
          <p className="text-sm text-slate-500">Recent Audit Logs</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="text-orange-500" size={20} />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length}</p>
          <p className="text-sm text-slate-500">High Risk Events</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="text-orange-500" size={20} />
              Recent Alerts
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Search alerts..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border-none rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
              ))
            ) : filteredAlerts.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                <Shield className="mx-auto text-slate-300 dark:text-slate-700 mb-4" size={48} />
                <p className="text-slate-500">No security alerts found matching your criteria.</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <motion.div 
                  layout
                  key={alert.id}
                  className={cn(
                    "p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow",
                    alert.status === 'new' && "border-l-4 border-l-orange-500"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className={cn("p-3 rounded-xl", getSeverityColor(alert.severity))}>
                        <AlertTriangle size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-slate-900 dark:text-white capitalize">{alert.type.replace(/_/g, ' ')}</h3>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase", getSeverityColor(alert.severity))}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                          {alert.type === 'account_locked' ? `Account locked for ${alert.details.email}` : 
                           alert.type === 'fraud_detected' ? `Potential fraud in ${alert.details.type}: ${alert.details.reasons?.join(', ')}` :
                           'Suspicious activity detected'}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Clock size={12} /> {format(new Date(alert.created_at), 'MMM d, h:mm a')}</span>
                          <span className="flex items-center gap-1"><Shield size={12} /> Status: {alert.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {alert.status !== 'resolved' && (
                        <button 
                          onClick={() => updateAlertStatus(alert.id, 'resolved')}
                          className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Mark as Resolved"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {alert.status === 'new' && (
                        <button 
                          onClick={() => updateAlertStatus(alert.id, 'reviewed')}
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Mark as Reviewed"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Audit Logs Section */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Clock className="text-blue-500" size={20} />
              Audit Logs
            </h2>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="p-4 h-16 bg-slate-50 dark:bg-slate-950/50 animate-pulse" />
                ))
              ) : auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No recent logs.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">{log.action.replace(/_/g, ' ')}</span>
                      <span className="text-[10px] text-slate-400">{format(new Date(log.created_at), 'HH:mm:ss')}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">
                      {log.resource_type}: {log.resource_id || 'N/A'}
                    </p>
                  </div>
                ))
              )}
            </div>
            <button className="w-full py-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border-t border-slate-100 dark:border-slate-800">
              View Full Audit Trail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
