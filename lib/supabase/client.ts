import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          if (typeof document === 'undefined') return undefined;
          const cookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`));
          return cookie ? cookie.split('=')[1] : undefined;
        },
        set(name, value, options) {
          if (typeof document === 'undefined') return;
          const isProd = process.env.NODE_ENV === 'production';
          let cookie = `${name}=${value}; path=/; max-age=${options.maxAge}; sameSite=${isProd ? 'none' : 'lax'}`;
          if (isProd || options.secure) cookie += '; secure';
          document.cookie = cookie;
        },
        remove(name) {
          if (typeof document === 'undefined') return;
          const isProd = process.env.NODE_ENV === 'production';
          document.cookie = `${name}=; path=/; max-age=0; sameSite=${isProd ? 'none' : 'lax'}${isProd ? '; secure' : ''}`;
        },
      },
    }
  );
