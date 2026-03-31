/**
 * Simple input sanitization to prevent basic prompt injection and XSS.
 * In a real-world scenario, you might use a more robust library like DOMPurify (for XSS)
 * or more advanced prompt injection detection.
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  // 1. Basic HTML escaping to prevent XSS if rendered unsafely
  let sanitized = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // 2. Remove potentially dangerous characters or patterns for prompt injection
  // This is a very basic example. Real prompt injection defense is much more complex.
  // We'll strip out common "ignore previous instructions" type patterns if they look suspicious.
  const dangerousPatterns = [
    /ignore previous instructions/gi,
    /system prompt/gi,
    /you are now/gi,
    /as an ai/gi
  ];

  dangerousPatterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  // 3. Limit length to prevent resource exhaustion
  const MAX_LENGTH = 1000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH) + '...';
  }

  return sanitized.trim();
}
