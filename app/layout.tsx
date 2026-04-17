import type { Metadata } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { ThemeProvider } from '@/context/theme-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { RecentlyViewedProvider } from '@/context/recently-viewed-context';
import { LanguageProvider } from '@/context/language-context';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '@/components/error-boundary';
import LayoutWrapper from '@/components/layout-wrapper';
import Chatbot from '@/components/chatbot';

import { headers } from 'next/headers';
import { validateEnv } from '@/lib/env';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'SecureCommerce | Premium E-Commerce',
  description: 'A modern, premium, and secure e-commerce platform.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Validate environment variables on server-side startup
  validateEnv();

  const nonce = (await headers()).get('x-nonce') || '';

  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
                  if (!theme && supportDarkMode) theme = 'dark';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased transition-colors duration-300">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <RecentlyViewedProvider>
                    <ErrorBoundary>
                      <LayoutWrapper>
                        {children}
                      </LayoutWrapper>
                      <Chatbot />
                      <Toaster 
                        position="top-center"
                        toastOptions={{
                          className: 'dark:bg-slate-900 dark:text-white dark:border dark:border-slate-800 shadow-2xl rounded-2xl px-6 py-4 text-sm font-semibold z-[99999]',
                          duration: 4000,
                          success: {
                            iconTheme: {
                              primary: '#10b981',
                              secondary: '#ffffff',
                            },
                          },
                          error: {
                            iconTheme: {
                              primary: '#ef4444',
                              secondary: '#ffffff',
                            },
                            duration: 6000,
                          },
                        }}
                      />
                    </ErrorBoundary>
                  </RecentlyViewedProvider>
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
