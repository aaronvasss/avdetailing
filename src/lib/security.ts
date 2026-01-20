/**
 * Security utilities for client-side protection
 */

/**
 * Sanitize user input for display (prevents XSS when using dangerouslySetInnerHTML)
 * Note: Prefer using React's default escaping instead of this function
 */
export function sanitizeForDisplay(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * Validate and sanitize URL for safe redirect
 * Prevents open redirect vulnerabilities
 */
export function getSafeRedirectUrl(url: string, allowedPaths: string[] = []): string | null {
  try {
    // Only allow relative URLs or same-origin URLs
    if (url.startsWith('/')) {
      // Check against allowedPaths if provided
      if (allowedPaths.length > 0) {
        const isAllowed = allowedPaths.some(path => url.startsWith(path));
        if (!isAllowed) return null;
      }
      return url;
    }
    
    // Parse as URL and check origin
    const parsed = new URL(url, window.location.origin);
    if (parsed.origin === window.location.origin) {
      return parsed.pathname + parsed.search;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Rate limit helper for client-side actions
 * Returns true if action should be allowed, false if rate limited
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string, 
  maxAttempts: number = 5, 
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const existing = rateLimitMap.get(key);
  
  if (!existing || now > existing.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (existing.count >= maxAttempts) {
    return false;
  }
  
  existing.count++;
  return true;
}

/**
 * Generate a secure random token for CSRF-like protection
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate that a string contains only expected characters
 * Useful for IDs, slugs, etc.
 */
export function isValidIdentifier(str: string, pattern: RegExp = /^[a-zA-Z0-9_-]+$/): boolean {
  return pattern.test(str);
}

/**
 * Mask sensitive data for logging/display
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }
  const start = data.slice(0, visibleChars);
  const end = data.slice(-visibleChars);
  const masked = '*'.repeat(Math.min(data.length - visibleChars * 2, 10));
  return `${start}${masked}${end}`;
}

/**
 * Check if email domain is commonly used for disposable/temporary emails
 * Note: This is a basic check - consider using a dedicated service for production
 */
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'throwaway.com', 'guerrillamail.com', 'mailinator.com',
  '10minutemail.com', 'temp-mail.org', 'fakeinbox.com', 'trashmail.com'
];

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.includes(domain) : false;
}
