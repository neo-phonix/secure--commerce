'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, Mail, ArrowRight, ArrowLeft, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { Spinner } from '@/components/ui/spinner';
import { useLanguage } from '@/context/language-context';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState<{ locked: boolean; until?: string } | null>(null);
  const { login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLockoutInfo(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await res.json();
      } catch (e) {
        throw new Error('Server returned an invalid response. Please try again later.');
      }

      if (res.ok) {
        console.log('Login API call successful, calling AuthContext.login()...');
        await login(data.session);
        toast.success(t.auth.login.success);
        router.push(returnTo);
      } else {
        if (data.locked) {
          setLockoutInfo({ locked: true, until: data.until });
          toast.error(t.auth.login.account_locked);
        } else {
          toast.error(data.error || t.auth.login.error);
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.auth.login.error);
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
        <div className="relative z-10 max-w-md text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
          >
            <Shield className="w-10 h-10 text-black" />
          </motion.div>
          <h2 className="text-4xl font-bold text-white tracking-tight mb-4">{t.auth.login.hero_title}</h2>
          <p className="text-white/50 leading-relaxed">
            {t.auth.login.hero_desc}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-900 text-black dark:text-white">
        <div className="w-full max-w-md relative">
          <button 
            onClick={handleBack}
            className="mb-8 flex items-center gap-2 text-sm font-bold text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors group px-4 py-2 bg-black/5 dark:bg-white/5 rounded-xl w-fit z-10 relative"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            {t.auth.login.back}
          </button>

          <div className="mb-10 lg:hidden">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-black dark:bg-white rounded-xl">
                <Shield className="w-5 h-5 text-white dark:text-black" />
              </div>
              <span className="font-bold text-xl tracking-tight">SecureCommerce</span>
            </Link>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2">{t.auth.login.title}</h1>
          <p className="text-black/50 dark:text-white/50 mb-8">{t.auth.login.subtitle}</p>

          {lockoutInfo?.locked && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-500">{t.auth.login.account_locked}</p>
                <p className="text-xs text-red-500/80 mt-1">
                  {t.auth.login.lockout_desc} {lockoutInfo.until && new Date(lockoutInfo.until).toLocaleTimeString()}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-black/70 dark:text-white/70" htmlFor="email">
                {t.auth.login.email_label}
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
                  placeholder={t.auth.login.email_placeholder}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold uppercase tracking-widest text-black/70 dark:text-white/70" htmlFor="password">
                  {t.auth.login.password_label}
                </label>
                <Link href="/forgot-password" title="Forgot Password?" className="text-xs font-bold text-black/70 dark:text-white/70 hover:text-primary dark:hover:text-primary transition-colors">
                  {t.auth.login.forgot_password}
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black/60 dark:text-white/60" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-14 py-3 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-primary/30 dark:focus:border-primary/30 focus:bg-white dark:focus:bg-slate-700 rounded-2xl outline-none transition-all text-black dark:text-white placeholder:text-black/60 dark:placeholder:text-white/60 font-semibold"
                  placeholder={t.auth.login.password_placeholder}
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
            </div>

            <button
              type="submit"
              disabled={loading || lockoutInfo?.locked}
              className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black/80 dark:hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Spinner size={20} />
                  {t.auth.login.loading}
                </>
              ) : (
                <>
                  {t.auth.login.btn_submit}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-black/50 dark:text-white/50">
            {t.auth.login.no_account}{' '}
            <Link href="/signup" className="font-bold text-black dark:text-white hover:underline">
              {t.auth.login.signup_link}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
