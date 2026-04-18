import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey || url.includes('TODO') || anonKey.includes('TODO')) {
    const missing = [];
    if (!url) missing.push('URL');
    if (!anonKey) missing.push('Anon Key');
    throw new Error(`Supabase configuration is incomplete. Missing: ${missing.join(', ')}. Please check your environment variables.`);
  }

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            const isProd = process.env.NODE_ENV === 'production';
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                httpOnly: false, // Explicitly allow client-side access
                secure: isProd,
                sameSite: isProd ? 'none' : 'lax',
              })
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

export const createAdminClient = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey || url.includes('TODO') || serviceRoleKey.includes('TODO')) {
    const missing = [];
    if (!url) missing.push('URL');
    if (!serviceRoleKey) missing.push('Service Role Key');
    throw new Error(`Supabase admin configuration is incomplete. Missing: ${missing.join(', ')}. Please check your environment variables.`);
  }

  return createServerClient(
    url,
    serviceRoleKey,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op for admin client
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    }
  );
};
