import { createClient } from '@/lib/supabase/server';
import { logAction } from '@/lib/audit';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export async function checkAccountLockout(email: string) {
  const supabase = await createClient();
  
  const { data: security, error } = await supabase
    .from('user_security')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking account lockout:', error);
    return { isLocked: false };
  }

  if (security && security.locked_until) {
    const lockedUntil = new Date(security.locked_until);
    if (lockedUntil > new Date()) {
      return { 
        isLocked: true, 
        lockedUntil,
        remainingMinutes: Math.ceil((lockedUntil.getTime() - Date.now()) / (60 * 1000))
      };
    }
  }

  return { isLocked: false };
}

export async function recordFailedLogin(email: string, ip: string, details: any = {}) {
  const supabase = await createClient();
  
  const { data: security, error } = await supabase
    .from('user_security')
    .select('*')
    .eq('email', email)
    .single();

  let failedAttempts = 1;
  let lockedUntil = null;

  if (security) {
    failedAttempts = security.failed_attempts + 1;
    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000).toISOString();
      
      // Create security alert for locked account
      await createSecurityAlert('account_locked', 'medium', {
        email,
        ip,
        failedAttempts,
        ...details
      });
    }
  }

  if (security) {
    await supabase
      .from('user_security')
      .update({
        failed_attempts: failedAttempts,
        locked_until: lockedUntil,
        last_failed_at: new Date().toISOString(),
        last_ip: ip
      })
      .eq('email', email);
  } else {
    await supabase
      .from('user_security')
      .insert({
        email,
        failed_attempts: failedAttempts,
        locked_until: lockedUntil,
        last_failed_at: new Date().toISOString(),
        last_ip: ip
      });
  }

  // Log suspicious activity if failed attempts are high
  if (failedAttempts >= 3) {
    await logAction('suspicious_login_attempt', 'user', undefined, undefined, {
      email,
      ip,
      failedAttempts,
      ...details
    }, 'medium');
  }
}

export async function resetFailedLogins(email: string) {
  const supabase = await createClient();
  await supabase
    .from('user_security')
    .update({
      failed_attempts: 0,
      locked_until: null
    })
    .eq('email', email);
}

export async function createSecurityAlert(
  type: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: any
) {
  const supabase = await createClient();
  await supabase.from('security_alerts').insert({
    type,
    severity,
    details,
    status: 'new',
    created_at: new Date().toISOString()
  });
}

export async function detectFraud(type: 'login' | 'order', data: any) {
  let riskScore = 0;
  const reasons: string[] = [];

  if (type === 'login') {
    // Check for many failed attempts from same IP (already handled by rate limiter, but we can add more)
    if (data.failedAttempts > 3) {
      riskScore += 30;
      reasons.push('Multiple failed login attempts');
    }
  }

  if (type === 'order') {
    // Unusual order amount
    if (data.amount > 100000) { // Example: > 1 Lakh
      riskScore += 40;
      reasons.push('Unusually high order amount');
    }

    // Multiple failed payments (if we had payment logs)
    if (data.failedPayments > 2) {
      riskScore += 50;
      reasons.push('Multiple failed payment attempts');
    }

    // Repeated rapid orders
    if (data.recentOrdersCount > 3) {
      riskScore += 40;
      reasons.push('Rapid repeated orders');
    }
  }

  const riskLevel = riskScore >= 70 ? 'high' : riskScore >= 30 ? 'medium' : 'low';

  if (riskLevel !== 'low') {
    await createSecurityAlert('fraud_detected', riskLevel === 'high' ? 'high' : 'medium', {
      type,
      riskScore,
      reasons,
      ...data
    });
  }

  return { riskLevel, riskScore, reasons };
}
