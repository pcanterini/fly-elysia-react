import Elysia from 'elysia';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

interface RateLimitConfig {
  windowMs?: number; // Time window in milliseconds
  max?: number; // Max requests per window
  message?: string; // Error message
  keyGenerator?: (request: Request) => string; // Function to generate key
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

const defaultConfig: Required<RateLimitConfig> = {
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests, please try again later',
  keyGenerator: (request: Request) => {
    // Use IP address from headers or fallback to a default
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0]?.trim() || 'unknown' : 'unknown';
    return ip;
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
};

// In-memory store (consider using Redis in production)
const store: RateLimitStore = {};

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key] && store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 60 * 1000); // Clean up every minute

export function createRateLimiter(config: RateLimitConfig = {}) {
  const options = { ...defaultConfig, ...config };

  return new Elysia({ name: 'rate-limiter' })
    .onBeforeHandle(({ request, set }) => {
      const key = options.keyGenerator(request);
      const now = Date.now();

      if (!store[key] || store[key].resetTime < now) {
        store[key] = {
          count: 1,
          resetTime: now + options.windowMs,
        };
      } else {
        store[key]!.count++;
      }

      // Check if limit exceeded
      if (store[key] && store[key].count > options.max) {
        set.status = 429; // Too Many Requests
        set.headers['Retry-After'] = String(Math.ceil((store[key].resetTime - now) / 1000));
        set.headers['X-RateLimit-Limit'] = String(options.max);
        set.headers['X-RateLimit-Remaining'] = '0';
        set.headers['X-RateLimit-Reset'] = new Date(store[key].resetTime).toISOString();
        
        return {
          error: {
            code: 'RATE_LIMIT',
            message: options.message,
            statusCode: 429,
          }
        };
      }

      // Add rate limit headers
      set.headers['X-RateLimit-Limit'] = String(options.max);
      set.headers['X-RateLimit-Remaining'] = String(options.max - store[key].count);
      set.headers['X-RateLimit-Reset'] = new Date(store[key].resetTime).toISOString();
    });
}

// Specific rate limiters for different endpoints
export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: 'Too many authentication attempts, please try again later',
});

export const apiRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
});