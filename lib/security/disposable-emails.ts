import disposableDomains from 'disposable-email-domains';
import localDisposableDomains from '@/data/disposable-domains.json';

// High-priority blocklist for extremely common disposable domains
const priorityBlocklist = new Set([
  'temp-mail.org',
  '10minutemail.com',
  'mailinator.com',
  'guerrillamail.com',
  'yopmail.com',
  'dispostable.com',
  'throwawaymail.com',
  'maildrop.cc',
  'tempmail.com',
  'getnada.com',
  'burnermail.io',
  'sharklasers.com',
  'trashmail.com',
  'fakemail.net'
]);

// Combine package domains and any local additions
const domainSet = new Set([...disposableDomains, ...localDisposableDomains, ...priorityBlocklist]);

console.log(`[SECURITY] Loaded ${domainSet.size} disposable domains`);

export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  
  const domain = email.split('@').pop()?.toLowerCase();
  
  if (!domain) return false;
  
  // 1. High-priority exact match check
  if (priorityBlocklist.has(domain)) {
     console.warn(`[SECURITY] Blocked high-priority disposable domain: ${domain}`);
     return true;
  }

  // 2. Check the full domain and all its parent domains
  // e.g., if domain is sub.temp-mail.org
  // check sub.temp-mail.org, then temp-mail.org, etc.
  const parts = domain.split('.');
  // i < parts.length - 1 to ensure we don't check just 'com' or 'org'
  for (let i = 0; i < parts.length - 1; i++) {
    const checkDomain = parts.slice(i).join('.');
    if (domainSet.has(checkDomain)) {
      console.warn(`[SECURITY] Blocked disposable domain detected: ${checkDomain} (Matched from: ${domain})`);
      return true;
    }
  }
  
  return false;
}
