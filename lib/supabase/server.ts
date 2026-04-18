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

  // 2. Exact match on normalized keys
  const allEntries = Object.entries(process.env);
  const normalizedKeys = keys.map(k => k.toUpperCase().replace(/^NEXT_PUBLIC_/, ''));
  
  for (const [key, value] of allEntries) {
    const uk = key.toUpperCase().replace(/^NEXT_PUBLIC_/, '');
    if (normalizedKeys.includes(uk)) return value;
  }

  // 3. Substring match
  for (const search of keys) {
    const us = search.toUpperCase().replace(/^NEXT_PUBLIC_/, '');
    for (const [key, value] of allEntries) {
      const uk = key.toUpperCase();
      if (uk.includes(us) || us.includes(uk)) return value;
    }
  }

  return undefined;
};

export const getSupabaseConfig = () => {
  const url = getEnv(['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL', 'URL']);
  const anonKey = getEnv(['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'ANON_KEY']);
  let serviceRoleKey = getEnv(['SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY', 'SERVICE_KEY', 'SUPABASE_SERVICE_KEY']);

  // FINAL FAILSAFE: Look for ANY key that contains BOTH 'SERVICE' and 'ROLE' and 'KEY'
  if (!serviceRoleKey) {
    const allKeys = Object.keys(process.env);
    const desperateMatch = allKeys.find(k => {
      const uk = k.toUpperCase();
      return uk.includes('SERVICE') && uk.includes('ROLE') && uk.includes('KEY');
    });
    if (desperateMatch) serviceRoleKey = process.env[desperateMatch];
  }

  if (!url || !anonKey || !serviceRoleKey) {
    const envKeys = Object.keys(process.env);
    console.log('CLIENT CONFIG CHECK - Env keys:', envKeys);
    console.log('CLIENT CONFIG CHECK - Found URL:', !!url, 'AnonKey:', !!anonKey, 'ServiceRole:', !!serviceRoleKey);
  }

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
    console.warn('Supabase admin configuration is incomplete. Security features (lockout) will be disabled.');
    return null;
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
