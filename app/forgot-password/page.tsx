'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { Spinner } from '@/components/ui/spinner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitted(true);
      toast.success('Reset link sent to your email!');
    } catch (error) {
      toast.error('Failed to send reset link. Please try again.');
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
          <h2 className="text-4xl font-bold text-white tracking-tight mb-4">Account Recovery</h2>
          <p className="text-white/50 leading-relaxed">
            Don't worry, it happens. Enter your email and we'll send you a link to reset your password.
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
            Back to login
          </button>

          <div className="mb-10 lg:hidden">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-black dark:bg-white rounded-xl">
                <Shield className="w-5 h-5 text-white dark:text-black" />
              </div>
              <span className="font-bold text-xl tracking-tight">SecureCommerce</span>
            </Link>
          </div>

          {!submitted ? (
            <>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Forgot Password?</h1>
              <p className="text-black/50 dark:text-white/50 mb-8">Enter your email address and we'll send you a recovery link.</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-black/70 dark:text-white/70" htmlFor="email">
                    Email Address
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
                      placeholder="name@company.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black/80 dark:hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Spinner size={20} />
                      Sending Link...
                    </>
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Check your email</h2>
              <p className="text-black/50 dark:text-white/50 mb-8">
                We've sent a password recovery link to <span className="font-bold text-black dark:text-white">{email}</span>.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="text-sm font-bold text-emerald-500 hover:text-emerald-600 transition-colors"
              >
                Didn't receive the email? Try again
              </button>
            </div>
          )}

          <p className="mt-8 text-center text-sm text-black/50 dark:text-white/50">
            Remember your password?{' '}
            <Link href="/login" className="font-bold text-black dark:text-white hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
