import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const isProd = process.env.NODE_ENV === 'production'
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          supabaseResponse = NextResponse.next({ request })

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: false, // Explicitly allow client-side access
              secure: isProd,
              sameSite: isProd ? 'none' : 'lax',
            })
          })
        },
      },
    }
  )

  const { data, error: authError } = await supabase.auth.getUser()
  const user = data?.user

  // Admin Session Timeout (Server-side)
  if (user) {
    // Fetch profile for trusted role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin' || profile?.role === 'super_admin') {
      const lastActivity = request.cookies.get('last_activity')?.value
      const now = Date.now()
      const timeout = 15 * 60 * 1000 // 15 minutes

      if (lastActivity && now - parseInt(lastActivity) > timeout) {
        // Session expired
        await supabase.auth.signOut()
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/login'
        redirectUrl.searchParams.set('message', 'Session expired due to inactivity')
        
        const response = NextResponse.redirect(redirectUrl)
        response.cookies.delete('last_activity')
        return response
      }

      // Update last activity
      supabaseResponse.cookies.set('last_activity', now.toString(), {
        path: '/',
        httpOnly: true, // This one is fine to be httpOnly as it's our own
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 60 * 60 // 1 hour
      })
    }
  }

  return supabaseResponse
}
