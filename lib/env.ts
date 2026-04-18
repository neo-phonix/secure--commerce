export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() { 
    return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || process.env.URL; 
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() { 
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.ANON_KEY || process.env.UPABASE_ANON_KEY; 
  },
  get SUPABASE_SERVICE_ROLE_KEY() { 
    return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || process.env.SERVICE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.E_SERVICE_ROLE_KEY; 
  },
  get GEMINI_API_KEY() { return process.env.GEMINI_API_KEY; },
  get RAZORPAY_KEY_ID() { return process.env.RAZORPAY_KEY_ID; },
  get RAZORPAY_KEY_SECRET() { return process.env.RAZORPAY_KEY_SECRET; },
  get NEXT_PUBLIC_RAZORPAY_KEY_ID() { return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID; },
  get ENCRYPTION_KEY() { return process.env.ENCRYPTION_KEY; },
  get ALLOWED_ORIGINS() { return process.env.ALLOWED_ORIGINS; },
  get APP_URL() { return process.env.APP_URL; },
};

export function validateEnv(requiredKeys?: string[]) {
  const defaultRequired = [
    'NEXT_PUBLIC_SUPABASE_URL|SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_ANON_KEY',
    'GEMINI_API_KEY',
    'ENCRYPTION_KEY',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'NEXT_PUBLIC_RAZORPAY_KEY_ID',
    'APP_URL',
    'ALLOWED_ORIGINS',
  ];

  const keysToValidate = requiredKeys || defaultRequired;
  const missing = [];

  for (const keyPattern of keysToValidate) {
    const keys = keyPattern.split('|');
    const found = keys.some(k => !!process.env[k]);
    if (!found) {
      missing.push(keys[0]);
    }
  }

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    if (process.env.NODE_ENV === 'production') {
      console.error(`[CRITICAL] ${message}`);
    } else {
      console.warn(`[WARNING] ${message}`);
    }
    return false;
  }

  if (keysToValidate.includes('ENCRYPTION_KEY') && env.ENCRYPTION_KEY && env.ENCRYPTION_KEY.length !== 32) {
    console.warn('Warning: ENCRYPTION_KEY should be a 32-character string for AES-256');
  }
  
  return true;
}
