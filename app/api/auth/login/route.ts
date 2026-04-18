import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import rateLimit from '@/lib/rate-limit';
import { z } from 'zod';
import validator from 'validator';

const loginSchema = z.object({
  email: z.string().email().transform(val => validator.normalizeEmail(val) || val),
  password: z.string().min(8),
});

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500,
  strict: false,
});

export async function POST(request: Request) {
  try {
    // Rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'anonymous';
    try {
      await limiter.check(10, `login-${ip}`); // Relaxed from 5 to 10
    } catch {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const validatedData = loginSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { email, password } = validatedData.data;

    // Check for required environment variables early
    const { getSupabaseConfig } = await import('@/lib/supabase/server');
    const { url, anonKey, serviceRoleKey } = getSupabaseConfig();

    if (!url || !anonKey || !serviceRoleKey) {
      const missing = [];
      if (!url) missing.push('SUPABASE_URL');
      if (!anonKey) missing.push('SUPABASE_ANON_KEY');
      if (!serviceRoleKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
      
      console.error('Missing Supabase configuration:', missing);
      
      // DIAGNOSTIC - Helps find malformed/cut-off labels
      const envKeys = Object.keys(process.env);
      const supabaseRelated = envKeys.filter(k => k.toUpperCase().includes('SUPABASE') || k.toUpperCase().includes('SERVICE') || k.toUpperCase().includes('KEY'));
      
      console.log('All available env keys:', envKeys);
      console.log('Supabase related keys:', supabaseRelated);

      return NextResponse.json({ 
        error: 'Supabase configuration is incomplete.',
        details: `Missing: ${missing.join(', ')}. Available keys: [${supabaseRelated.join(', ')}]. All keys count: ${envKeys.length}. Please ensure SUPABASE_SERVICE_ROLE_KEY is set in settings.`
      }, { status: 500 });
    }
    
    // Check for account lockout
    const { checkAccountLockout, recordFailedLogin, resetFailedLogins } = await import('@/lib/security');
    const { isLocked, remainingMinutes } = await checkAccountLockout(email);
    
    if (isLocked) {
      return NextResponse.json({ 
        error: `Account is locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minutes.` 
      }, { status: 403 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Record failed login attempt
      await recordFailedLogin(email, ip, { error: error.message });
      
      // Slow down brute force attacks
      await new Promise(resolve => setTimeout(resolve, 1000));
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    // Reset failed logins on success
    await resetFailedLogins(email);

    // Log successful login
    const { logAction } = await import('@/lib/audit');
    await logAction('login', 'user', data.user.id);

    return NextResponse.json({ 
      message: 'Logged in successfully', 
      user: data.user,
      session: data.session 
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
