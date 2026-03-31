'use client';

import { Shield, Lock, Database, ChevronRight, Eye, Target, Heart, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/language-context';

export default function AboutPage() {
  const { t } = useLanguage();

  const securityFeatures = [
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Broken Access Control",
      description: "Implemented strict session management with HTTP-only, secure cookies and server-side authorization checks for all protected routes.",
      owasp: "A01:2021"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Cryptographic Failures",
      description: "Sensitive data like passwords are hashed using bcrypt with a high cost factor (12 rounds). JWT tokens are signed with HS256.",
      owasp: "A02:2021"
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Injection Protection",
      description: "Using parameterized queries with SQLite to prevent SQL injection. Input validation is enforced using Zod schemas.",
      owasp: "A03:2021"
    }
  ];

  const stats = [
    { label: t.about.stats.founded, value: "2024" },
    { label: t.about.stats.customers, value: "50k+" },
    { label: t.about.stats.audits, value: "Weekly" },
    { label: t.about.stats.uptime, value: "99.9%" }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-12">
          <Link href="/" className="hover:text-primary transition-colors">{t.nav.home}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 dark:text-white">{t.about.breadcrumb}</span>
        </div>

        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-8 dark:text-white leading-tight">
              {t.about.title.split('Secure')[0]}<span className="text-emerald-500">Secure</span>{t.about.title.split('Secure')[1]}
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed mb-10">
              {t.about.subtitle}
            </p>
            <div className="grid grid-cols-2 gap-8">
              {stats.map((stat, i) => (
                <div key={i}>
                  <p className="text-3xl font-bold dark:text-white mb-1">{stat.value}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative aspect-square rounded-[4rem] overflow-hidden shadow-2xl"
          >
            <Image 
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1000"
              alt="Our Office"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay" />
          </motion.div>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-3 gap-8 mb-32">
          <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4 dark:text-white">{t.about.mission.title}</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.about.mission.description}
            </p>
          </div>
          <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4 dark:text-white">{t.about.vision.title}</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.about.vision.description}
            </p>
          </div>
          <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center mb-6">
              <Heart className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4 dark:text-white">{t.about.values.title}</h3>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.about.values.description}
            </p>
          </div>
        </div>

        {/* Security Architecture Section */}
        <div className="mb-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold mb-6 dark:text-white">{t.about.security_architecture.title}</h2>
            <p className="text-slate-500 dark:text-slate-400">
              {t.about.security_architecture.subtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {securityFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-8 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 transition-all group shadow-sm"
              >
                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                    {feature.owasp}
                  </span>
                  <h3 className="font-bold text-lg dark:text-white">{feature.title}</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Continuous Monitoring Banner */}
        <div className="p-12 bg-slate-900 text-white rounded-[4rem] relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#ffffff,transparent)]" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-xl">
              <h2 className="text-4xl font-display font-bold mb-6">{t.about.monitoring.title}</h2>
              <p className="text-white/50 leading-relaxed text-lg">
                {t.about.monitoring.subtitle}
              </p>
              <div className="mt-8 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">PCI DSS Level 1</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">SOC 2 Type II</span>
                </div>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="w-48 h-48 border-8 border-white/5 rounded-full flex items-center justify-center relative">
                <ShieldCheck className="w-20 h-20 text-emerald-400" />
                <div className="absolute inset-0 border-8 border-emerald-400 rounded-full border-t-transparent animate-[spin_3s_linear_infinite]" />
                <div className="absolute -inset-4 border border-white/10 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

