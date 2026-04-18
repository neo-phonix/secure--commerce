import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Robustly finds a Supabase environment variable in process.env
 */
export const getEnv = (keys: string[]) => {
  // 1. Direct match
  for (const key of keys) {
    if (process.env[key]) return process.env[key];
  }

  // 2. Case-insensitive and partial match (fallback for malformed labels)
  const allKeys = Object.keys(process.env);
  for (const search of keys) {
    const found = allKeys.find(k => {
      const uk = k.toUpperCase();
      const us = search.toUpperCase();
      return uk === us || uk.includes(us) || us.includes(uk);
    });
    if (found && process.env[found]) return process.env[found];
  }
  return undefined;
};

export const getSupabaseConfig = () => {
  const url = getEnv(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL', 'URL']);
  const anonKey = getEnv(['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'ANON_KEY']);
  const serviceRoleKey = getEnv(['SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY', 'SERVICE_KEY', 'SUPABASE_SERVICE_KEY']);

  return { url, anonKey, serviceRoleKey };
};

export const createClient = async () => {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey || url.includes('TODO') || anonKey.includes('TODO')) {
    const missing = [];
    if (!url) missing.push('SUPABASE_URL');
    if (!anonKey) missing.push('SUPABASE_ANON_KEY');
    throw new Error(`Supabase configuration is incomplete. Missing: ${missing.join(', ')}. Please check your environment variables in settings.`);
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
  const { url, serviceRoleKey } = getSupabaseConfig();

  if (!url || !serviceRoleKey || url.includes('TODO') || serviceRoleKey.includes('TODO')) {
    const missing = [];
    if (!url) missing.push('SUPABASE_URL');
    if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    throw new Error(`Supabase admin configuration is incomplete. Missing: ${missing.join(', ')}. Please check your environment variables in settings.`);
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
