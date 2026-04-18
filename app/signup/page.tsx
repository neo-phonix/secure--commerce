'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, Mail, User, ArrowRight, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { Spinner } from '@/components/ui/spinner';
import { useLanguage } from '@/context/language-context';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);

  const { t } = useLanguage();
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return; // Silent fail for bots
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, website: honeypot }),
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error('Server returned an invalid response. Please try again later.');
      }

      if (res.ok) {
        if (data.session) {
          const { useAuth } = await import('@/context/auth-context');
          // We need to access the login function from context
          // Since we're in a component, we can use the hook we already have access to if we add it
          // But wait, I didn't import useAuth in Signup component yet.
          toast.success(t.auth.signup.success);
          router.push('/login'); // Default behavior is to go to login
        } else {
          toast.success(t.auth.signup.success);
          router.push('/login');
        }
      } else {
        toast.error(data.error || t.auth.signup.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.auth.signup.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex bg-black relative overflow-hidden items-center justify-center p-12">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#3a1510,transparent)]" />
        </div>
        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-2xl"
          >
            <Shield className="w-8 h-8 text-black" />
          </motion.div>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-8">{t.auth.signup.hero_title}</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="mt-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-white font-bold">{t.auth.signup.feature1_title}</h4>
                <p className="text-white/40 text-sm">{t.auth.signup.feature1_desc}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-white font-bold">{t.auth.signup.feature2_title}</h4>
                <p className="text-white/40 text-sm">{t.auth.signup.feature2_desc}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="mt-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-white font-bold">{t.auth.signup.feature3_title}</h4>
                <p className="text-white/40 text-sm">{t.auth.signup.feature3_desc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-900 text-black dark:text-white">
        <div className="w-full max-w-md relative">
          <button 
            onClick={handleBack}
            className="mb-8 flex items-center gap-2 text-sm font-bold text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors group px-4 py-2 bg-black/5 dark:bg-white/5 rounded-xl w-fit z-10 relative"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {t.auth.signup.back}
          </button>

          <div className="mb-10 lg:hidden">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-black dark:bg-white rounded-xl">
                <Shield className="w-5 h-5 text-white dark:text-black" />
              </div>
              <span className="font-bold text-xl tracking-tight">SecureCommerce</span>
            </Link>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2">{t.auth.signup.title}</h1>
          <p className="text-black/50 dark:text-white/50 mb-8">{t.auth.signup.subtitle}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-black/70 dark:text-white/70" htmlFor="name">
                {t.auth.signup.name_label}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/60 dark:text-white/60" />
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-primary/30 dark:focus:border-primary/30 focus:bg-white dark:focus:bg-slate-700 rounded-2xl outline-none transition-all text-black dark:text-white placeholder:text-black/60 dark:placeholder:text-white/60 font-semibold"
                  placeholder={t.auth.signup.name_placeholder}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-black/70 dark:text-white/70" htmlFor="email">
                {t.auth.signup.email_label}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/60 dark:text-white/60" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-primary/30 dark:focus:border-primary/30 focus:bg-white dark:focus:bg-slate-700 rounded-2xl outline-none transition-all text-black dark:text-white placeholder:text-black/60 dark:placeholder:text-white/60 font-semibold"
                  placeholder={t.auth.signup.email_placeholder}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-black/70 dark:text-white/70" htmlFor="password">
                {t.auth.signup.password_label}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/60 dark:text-white/60" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-14 py-3 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-primary/30 dark:focus:border-primary/30 focus:bg-white dark:focus:bg-slate-700 rounded-2xl outline-none transition-all text-black dark:text-white placeholder:text-black/60 dark:placeholder:text-white/60 font-semibold"
                  placeholder={t.auth.signup.password_placeholder}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-all z-10 cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95 bg-black/5 dark:bg-white/5 rounded-full"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-black/60 dark:text-white/60 leading-tight">
                {t.auth.signup.password_hint}
              </p>
            </div>

            {/* Honeypot field - hidden from users */}
            <div className="hidden" aria-hidden="true">
              <input
                type="text"
                name="website"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black/80 dark:hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Spinner size={20} />
                  {t.auth.signup.loading}
                </>
              ) : (
                <>
                  {t.auth.signup.btn_submit}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-black/50 dark:text-white/50">
            {t.auth.signup.have_account}{' '}
            <Link href="/login" className="font-bold text-black dark:text-white hover:underline">
              {t.auth.signup.login_link}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
