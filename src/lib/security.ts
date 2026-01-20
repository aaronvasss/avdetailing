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
 * Rate limit helper for client-side actions with localStorage persistence
 * Returns true if action should be allowed, false if rate limited
 */
interface RateLimitEntry {
  timestamps: number[];
  blocked_until?: number;
}

const RATE_LIMIT_STORAGE_KEY = 'av_rate_limits';

function getRateLimitStorage(): Record<string, RateLimitEntry> {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function setRateLimitStorage(data: Record<string, RateLimitEntry>): void {
  try {
    localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage might be full or disabled
  }
}

export function checkRateLimit(
  key: string, 
  maxAttempts: number = 5, 
  windowMs: number = 60000,
  blockDurationMs: number = 300000 // 5 minute block after exceeding limit
): { allowed: boolean; remainingAttempts: number; blockedUntil?: Date } {
  const now = Date.now();
  const storage = getRateLimitStorage();
  let entry = storage[key] || { timestamps: [] };
  
  // Check if currently blocked
  if (entry.blocked_until && now < entry.blocked_until) {
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      blockedUntil: new Date(entry.blocked_until) 
    };
  }
  
  // Clear block if expired
  if (entry.blocked_until && now >= entry.blocked_until) {
    entry.blocked_until = undefined;
    entry.timestamps = [];
  }
  
  // Filter timestamps within the window
  entry.timestamps = entry.timestamps.filter(ts => now - ts < windowMs);
  
  // Check if at limit
  if (entry.timestamps.length >= maxAttempts) {
    // Block the user
    entry.blocked_until = now + blockDurationMs;
    storage[key] = entry;
    setRateLimitStorage(storage);
    return { 
      allowed: false, 
      remainingAttempts: 0, 
      blockedUntil: new Date(entry.blocked_until) 
    };
  }
  
  // Add current timestamp
  entry.timestamps.push(now);
  storage[key] = entry;
  setRateLimitStorage(storage);
  
  return { 
    allowed: true, 
    remainingAttempts: maxAttempts - entry.timestamps.length 
  };
}

/**
 * Get remaining time until rate limit resets
 */
export function getRateLimitStatus(key: string): { 
  isBlocked: boolean; 
  blockedUntil?: Date;
  attemptsInWindow: number;
} {
  const now = Date.now();
  const storage = getRateLimitStorage();
  const entry = storage[key];
  
  if (!entry) {
    return { isBlocked: false, attemptsInWindow: 0 };
  }
  
  if (entry.blocked_until && now < entry.blocked_until) {
    return { 
      isBlocked: true, 
      blockedUntil: new Date(entry.blocked_until),
      attemptsInWindow: entry.timestamps.length 
    };
  }
  
  return { 
    isBlocked: false, 
    attemptsInWindow: entry.timestamps.length 
  };
}

/**
 * Clear rate limit for a specific key (e.g., after successful action)
 */
export function clearRateLimit(key: string): void {
  const storage = getRateLimitStorage();
  delete storage[key];
  setRateLimitStorage(storage);
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
