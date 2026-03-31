'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthCodeError() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8"
        >
          <AlertCircle className="w-10 h-10 text-red-500" />
        </motion.div>

        <h1 className="text-3xl font-bold tracking-tight mb-4 dark:text-white">Authentication Error</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          There was an error during the authentication process. This could be due to an expired link or a configuration issue.
        </p>

        <div className="space-y-4">
          <Link
            href="/login"
            className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black/80 dark:hover:bg-white/90 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Login
          </Link>
          
          <Link
            href="/"
            className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-black dark:text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <Shield className="w-5 h-5" />
            Go to Home
          </Link>
        </div>

        <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl text-left">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">Troubleshooting</h3>
          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2 list-disc pl-4">
            <li>Ensure that Google OAuth is enabled in your Supabase dashboard.</li>
            <li>Check that your redirect URLs are correctly configured.</li>
            <li>Try clearing your browser cookies and attempting to log in again.</li>
            <li>If you are using an iframe, ensure third-party cookies are allowed.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
