import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import rateLimit from '@/lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 users per interval
  strict: false, // Allow in-memory fallback if DB rate limiter is unavailable
})

export async function middleware(request: NextRequest) {
  // 1. Rate Limiting (Brute Force & Bot Protection)
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1';
  
  const path = request.nextUrl.pathname;
  const isAuthRoute = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/api/auth')
  const isPaymentRoute = path.startsWith('/api/checkout') || path.startsWith('/api/orders')
  const isCouponRoute = path.startsWith('/api/coupons')

  try {
    if (isAuthRoute) await limiter.check(30, `rate-limit-auth-${ip}`) // Relaxed from 15 to 30
    if (isPaymentRoute && request.method === 'POST') await limiter.check(10, `rate-limit-payment-${ip}`) // Relaxed from 5 to 10
    if (isCouponRoute) await limiter.check(20, `rate-limit-coupon-${ip}`) // Relaxed from 10 to 20
  } catch {
    // We only return 429 if the limit is actually exceeded, not if the service is down (due to strict: false)
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
  }

  // 2. CSRF Protection (Strict Origin Validation)
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const originHeader = request.headers.get('origin')
    const refererHeader = request.headers.get('referer')
    const host = request.headers.get('host')
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    
    // In production, we require an origin or referer header for state-changing requests
    if (!originHeader && !refererHeader && process.env.NODE_ENV === 'production') {
      console.error('CSRF: Missing origin and referer headers')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const source = originHeader || refererHeader
    if (source) {
      try {
        const sourceUrl = new URL(source)
        const allowedOrigins = new Set<string>()
        
        // Helper to normalize and add origins
        const addOrigin = (url: string) => {
          try {
            const normalized = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`
            const origin = new URL(normalized).origin
            allowedOrigins.add(origin)
          } catch {}
        }

        // Always allow self (current host)
        if (host) {
          addOrigin(`${protocol}://${host}`)
        }

        // Parse ALLOWED_ORIGINS from env
        if (process.env.ALLOWED_ORIGINS) {
          process.env.ALLOWED_ORIGINS.split(',').forEach(addOrigin)
        }
        
        // Always allow self if APP_URL or SHARED_APP_URL is set
        if (process.env.APP_URL) addOrigin(process.env.APP_URL)
        if (process.env.SHARED_APP_URL) addOrigin(process.env.SHARED_APP_URL)
        
        // Add localhost for dev
        if (process.env.NODE_ENV === 'development') {
          allowedOrigins.add('http://localhost:3000')
        }

        // Add AI Studio preview domains as a fallback
        if (sourceUrl.origin.endsWith('.run.app') || sourceUrl.origin === 'https://ai.studio') {
          allowedOrigins.add(sourceUrl.origin)
        }

        // Exact match on normalized origin
        if (!allowedOrigins.has(sourceUrl.origin)) {
          console.error(`CSRF: Origin ${sourceUrl.origin} not in allowed origins:`, Array.from(allowedOrigins))
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      } catch (e) {
        console.error('CSRF: Error validating origin:', e)
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
  }

  // 3. Update Supabase session
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey || url.includes('TODO') || anonKey.includes('TODO')) {
    console.error('Supabase configuration is missing or invalid in middleware')
    return NextResponse.json({ 
      error: 'Supabase configuration is missing or invalid',
      details: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set correctly. Please check your environment variables.'
    }, { status: 500 })
  }
  
  let response;
  try {
    response = await updateSession(request)
  } catch (err: any) {
    console.error('Middleware: Error updating session:', err)
    return NextResponse.json({ 
      error: 'Session update failed',
      details: err?.message || 'An unexpected error occurred during session management.'
    }, { status: 500 })
  }

  // 4. Security Headers (OWASP Best Practice)
  const nonce = btoa(crypto.randomUUID())
  
  // If updateSession returned a redirect, we should respect it but still add security headers
  const isRedirect = response.status >= 300 && response.status < 400
  
  if (!isRedirect) {
    // For non-redirects, we can add the nonce to the request headers for server components
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-nonce', nonce)
    
    // Create a new response that continues the request with updated headers
    const nextResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    
    // Copy all headers from the supabase response to the new response
    // We must use append for Set-Cookie to preserve multiple cookies
    const setCookies = response.headers.getSetCookie();
    
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'set-cookie') {
        nextResponse.headers.set(key, value)
      }
    })
    
    if (setCookies.length > 0) {
      nextResponse.headers.delete('set-cookie')
      setCookies.forEach(cookie => {
        nextResponse.headers.append('set-cookie', cookie)
      })
    }
    
    response = nextResponse
  }

  // Strict CSP
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://*.supabase.co https://checkout.razorpay.com`,
    "style-src 'self' https://fonts.googleapis.com",
    "img-src 'self' data: https://picsum.photos https://*.supabase.co https://ui-avatars.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com https://generativelanguage.googleapis.com",
    "frame-src 'self' https://checkout.razorpay.com",
    "frame-ancestors 'self' https://*.run.app https://ai.studio",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "block-all-mixed-content",
    "upgrade-insecure-requests",
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  response.headers.set('x-nonce', nonce)
  // Remove X-Frame-Options to allow embedding in AI Studio preview
  response.headers.delete('X-Frame-Options')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin')
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none')

  // 5. CORS Headers (Restrictive)
  const origin = request.headers.get('origin')
  if (origin) {
    const allowedOrigins = new Set<string>()
    
    // Parse ALLOWED_ORIGINS from env
    if (process.env.ALLOWED_ORIGINS) {
      process.env.ALLOWED_ORIGINS.split(',').forEach(o => {
        const trimmed = o.trim()
        if (trimmed) {
          try {
            const urlString = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
            allowedOrigins.add(new URL(urlString).origin)
          } catch {}
        }
      })
    }
    
    // Always allow self if APP_URL or SHARED_APP_URL is set
    if (process.env.APP_URL) {
      try { allowedOrigins.add(new URL(process.env.APP_URL).origin) } catch {}
    }
    if (process.env.SHARED_APP_URL) {
      try { allowedOrigins.add(new URL(process.env.SHARED_APP_URL).origin) } catch {}
    }
    
    // Add localhost for dev
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.add('http://localhost:3000')
    }

    if (allowedOrigins.has(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-nonce')
      response.headers.set('Access-Control-Allow-Credentials', 'true')
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
