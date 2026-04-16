import { LRUCache } from 'lru-cache';
import { createClient } from '@supabase/supabase-js';

type Options = {
  uniqueTokenPerInterval?: number;
  interval?: number;
  strict?: boolean; // If true, fails if DB rate limiter is unavailable (no in-memory fallback)
};

/**
 * Production-grade rate limiting should use a shared store like Redis or a database.
 * This implementation uses an in-memory LRU cache for development/single-instance
 * and provides a structure that can be easily swapped for a shared store.
 */
class RateLimiter {
  private cache: LRUCache<string, number>;
  private interval: number;
  private strict: boolean;

  constructor(options?: Options) {
    this.interval = options?.interval || 60000;
    this.strict = options?.strict || false;
    this.cache = new LRUCache({
      max: options?.uniqueTokenPerInterval || 500,
      ttl: this.interval,
    });
  }

  /**
   * Checks if the token is within the rate limit.
   * In production, this should ideally use a shared store like Redis or a database RPC.
   */
  async check(limit: number, token: string): Promise<void> {
    // We always try to use the database-backed rate limiter first
    // to ensure consistency across multiple instances.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      console.warn('Supabase env vars missing for rate limiting, falling back to in-memory');
      return this.checkInMemory(limit, token);
    }

    try {
      // We use a separate client for rate limiting to avoid session issues in middleware
      const supabase = createClient(url, key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          }
        }
      );

      const { data: allowed, error } = await supabase.rpc('check_rate_limit', {
        p_key: token,
        p_limit: limit,
        p_interval_seconds: Math.floor(this.interval / 1000)
      });

      if (error) {
        console.error('Rate limit RPC error:', error);
        
        // In strict mode, we fail if the distributed store is unavailable
        if (this.strict) {
          throw new Error('Rate limiting service unavailable');
        }
        
        // Fallback to in-memory if DB fails to ensure availability (non-strict)
        return this.checkInMemory(limit, token);
      }

      if (!allowed) {
        throw new Error('Rate limit exceeded');
      }
      return;
    } catch (err) {
      if (err instanceof Error && (err.message === 'Rate limit exceeded' || err.message === 'Rate limiting service unavailable')) {
        throw err;
      }
      
      console.error('Database rate limiter failed:', err);
      
      if (this.strict) {
        throw new Error('Rate limiting service unavailable');
      }
      
      return this.checkInMemory(limit, token);
    }
  }

  private checkInMemory(limit: number, token: string): void {
    const currentUsage = (this.cache.get(token) || 0) + 1;
    this.cache.set(token, currentUsage);

    if (currentUsage > limit) {
      throw new Error('Rate limit exceeded');
    }
  }
}

export default function rateLimit(options?: Options) {
  return new RateLimiter(options);
}
