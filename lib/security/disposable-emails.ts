import disposableDomains from '@/data/disposable-domains.json';

const domainSet = new Set(disposableDomains);

export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return true;
  
  const domain = email.split('@')[1].toLowerCase();
  return domainSet.has(domain);
}
