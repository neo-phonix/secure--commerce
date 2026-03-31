'use client';

import Link from 'next/link';
import { ShieldCheck, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Youtube, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/context/language-context';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-950 text-slate-400 pt-24 pb-12 border-t border-slate-900">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="space-y-6">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-display font-bold text-white tracking-tight">
                Secure<span className="text-emerald-500">Commerce</span>
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed">
              {t.footer.description}
            </p>
            <div className="flex items-center space-x-4">
              <Link href="#" className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
                <Youtube className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-8">{t.footer.quick_links}</h3>
            <ul className="space-y-4">
              <li><Link href="/products" className="hover:text-emerald-500 transition-colors">{t.footer.links.all_products}</Link></li>
              <li><Link href="/categories" className="hover:text-emerald-500 transition-colors">{t.footer.links.categories}</Link></li>
              <li><Link href="/about" className="hover:text-emerald-500 transition-colors">{t.footer.links.about}</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-500 transition-colors">{t.footer.links.contact}</Link></li>
              <li><Link href="/faq" className="hover:text-emerald-500 transition-colors">{t.footer.links.faq}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-8">{t.footer.customer_service}</h3>
            <ul className="space-y-4">
              <li><Link href="/shipping" className="hover:text-emerald-500 transition-colors">{t.footer.links.shipping}</Link></li>
              <li><Link href="/returns" className="hover:text-emerald-500 transition-colors">{t.footer.links.returns}</Link></li>
              <li><Link href="/privacy" className="hover:text-emerald-500 transition-colors">{t.footer.links.privacy}</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-500 transition-colors">{t.footer.links.terms}</Link></li>
              <li><Link href="/support" className="hover:text-emerald-500 transition-colors">{t.footer.links.support}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-8">{t.footer.newsletter.title}</h3>
            <p className="text-slate-400 mb-6">{t.footer.newsletter.subtitle}</p>
            <form className="space-y-4">
              <div className="relative">
                <input
                  type="email"
                  placeholder={t.footer.newsletter.placeholder}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-4 px-6 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 px-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="pt-12 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm">© 2026 SecureCommerce. {t.footer.rights}</p>
          <div className="flex items-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-emerald-500" />
              <span>support@securecommerce.com</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-emerald-500" />
              <span>+1 (555) 000-0000</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

