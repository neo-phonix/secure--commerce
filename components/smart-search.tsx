'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, Shield, Zap, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency } from '@/lib/utils';

interface Suggestion {
  id: string;
  name: string;
  slug: string;
  image_url: string;
  price: number;
  category: string;
}

export default function SmartSearch() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.slice(0, 5));
        }
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <form onSubmit={handleSearch} className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30 dark:text-white/30 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search secure assets..."
          className="w-full pl-11 pr-11 py-3 bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-black dark:focus:ring-white transition-all dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-3 h-3 text-black/30 dark:text-white/30" />
          </button>
        )}
      </form>

      <AnimatePresence>
        {isOpen && (query.length >= 2 || suggestions.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-black/5 dark:border-white/5 overflow-hidden z-50"
          >
            <div className="p-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size={20} />
                </div>
              ) : suggestions.length > 0 ? (
                <div className="space-y-1">
                  <div className="px-3 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30">Suggestions</span>
                  </div>
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        router.push(`/products/${item.slug}`);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-2xl transition-colors group text-left"
                    >
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0">
                        <Image
                          src={item.image_url || 'https://picsum.photos/seed/placeholder/100/100'}
                          alt={item.name}
                          fill
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="text-sm font-bold dark:text-white truncate">{item.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(item.price)}</span>
                          <span className="text-[10px] text-black/30 dark:text-white/30 uppercase tracking-widest">{item.category}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-black/0 group-hover:text-black/20 dark:group-hover:text-white/20 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    </button>
                  ))}
                  <button
                    onClick={handleSearch}
                    className="w-full p-3 text-center text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors border-t border-black/5 dark:border-white/5 mt-2"
                  >
                    View all results for &quot;{query}&quot;
                  </button>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Search className="w-8 h-8 text-black/10 dark:text-white/10 mx-auto mb-3" />
                  <p className="text-sm text-black/40 dark:text-white/40">No matching secure assets found</p>
                </div>
              )}
            </div>

            {/* Quick Links / Security Features */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 border-t border-black/5 dark:border-white/5">
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1 text-center">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className="text-[8px] font-bold uppercase tracking-tighter dark:text-white">Verified</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <Lock className="w-4 h-4 text-blue-500" />
                  <span className="text-[8px] font-bold uppercase tracking-tighter dark:text-white">Encrypted</span>
                </div>
                <div className="flex flex-col items-center gap-1 text-center">
                  <Zap className="w-4 h-4 text-purple-500" />
                  <span className="text-[8px] font-bold uppercase tracking-tighter dark:text-white">Fast</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
