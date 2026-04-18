import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import rateLimit from '@/lib/rate-limit';
import { z } from 'zod';
import validator from 'validator';
import { isDisposableEmail } from '@/lib/security/disposable-emails';

const signupSchema = z.object({
  email: z.string().email().transform(val => validator.normalizeEmail(val) || val),
  password: z.string().min(8).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
  }),
  name: z.string().min(2).max(100).transform(val => val.trim()),
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
      await limiter.check(10, `signup-${ip}`); // Relaxed from 3 to 10
    } catch {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    
    // CAPTCHA Validation
    const captchaToken = body.captchaToken;
    if (!captchaToken) {
      return NextResponse.json({ error: 'CAPTCHA verification is required.' }, { status: 400 });
    }

    try {
      const secretKey = process.env.TURNSTILE_SECRET_KEY || '0x4AAAAAAASv98pSBy1859h7';
      const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${secretKey}&response=${captchaToken}`,
      });

      const turnstileData = await turnstileRes.json();
      if (!turnstileData.success) {
        console.warn('[SECURITY] CAPTCHA validation failed');
        return NextResponse.json({ error: 'CAPTCHA verification failed. Please try again.' }, { status: 403 });
      }
    } catch (err) {
      console.error('CAPTCHA verification error:', err);
      // Fallback: in production you might want to fail closed, but for dev we might allow if service is down
      // unless strict protection is needed.
    }

    // Honeypot check
    if (body.website) {
      return NextResponse.json({ message: 'User created successfully.' }, { status: 201 });
    }

    const validatedData = signupSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ error: 'Invalid input', details: validatedData.error.format() }, { status: 400 });
    }

    const { email, password, name } = validatedData.data;

    // Disposable email check
    if (isDisposableEmail(email)) {
      console.warn(`[SECURITY] Blocked disposable email signup attempt: ${email}`);
      return NextResponse.json({ error: 'Temporary email addresses are not allowed.' }, { status: 400 });
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({ 
        error: 'Supabase configuration is missing. Please set up your environment variables.' 
      }, { status: 500 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: 'customer',
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.session) {
      return NextResponse.json({ 
        message: 'User created and logged in successfully', 
        user: data.user,
        session: data.session
      }, { status: 201 });
    }

    return NextResponse.json({ message: 'User created successfully. Please check your email for verification.' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
