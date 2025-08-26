import Redis from 'ioredis';

/**
 * Create Redis connection for Upstash on Fly.io
 * 
 * IMPORTANT: The fly-*.upstash.io hostnames are only accessible from within 
 * Fly.io's private network. They will NOT work from local development or 
 * external networks.
 * 
 * For local development, either:
 * 1. Use a local Redis instance (redis://localhost:6379)
 * 2. Use `fly redis connect` to create a tunnel
 * 3. Use a different Redis provider with public endpoints
 */
export const createUpstashConnection = () => {
  const url = process.env.REDIS_URL;
  
  if (!url) {
    console.log('[Redis] No REDIS_URL configured');
    return null;
  }

  // Check if we're in production (on Fly.io)
  const isProduction = process.env.FLY_APP_NAME || process.env.NODE_ENV === 'production';
  
  console.log(`[Redis] Attempting connection (${isProduction ? 'production' : 'development'})...`);
  console.log('[Redis] URL:', url.replace(/:[^:@]*@/, ':****@'));

  try {
    const options: any = {
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
      retryStrategy: (times: number) => {
        if (times > 10) {
          console.error('[Redis] Connection failed after 10 attempts');
          // In production, keep retrying slowly
          if (isProduction) {
            return 5000; // Retry every 5 seconds
          }
          return null; // Stop retrying in development
        }
        const delay = Math.min(times * 100, 2000);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        console.error('[Redis] Reconnect on error:', err.message);
        return true;
      },
      lazyConnect: false, // Try to connect immediately in production
    };

    // For Upstash on Fly.io, we may need IPv6
    if (isProduction && url.includes('upstash.io')) {
      options.family = 6; // Try IPv6 first
      options.enableOfflineQueue = true;
      console.log('[Redis] Using IPv6 for Fly.io internal network');
    }

    const connection = new Redis(url, options);

    connection.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
      if (err.message.includes('ENOTFOUND')) {
        console.error('[Redis] DNS resolution failed. This is expected if not running on Fly.io network.');
        if (!isProduction) {
          console.error('[Redis] For local development, use local Redis or fly redis connect');
        }
      }
    });

    connection.on('connect', () => {
      console.log('[Redis] Connected successfully!');
    });

    connection.on('ready', () => {
      console.log('[Redis] Connection ready');
    });

    connection.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });

    return connection;
  } catch (error: any) {
    console.error('[Redis] Failed to create connection:', error.message);
    return null;
  }
};

// Alternative: Use HTTP-based Upstash client (works from anywhere)
export const createUpstashHttpClient = async () => {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.log('[Redis HTTP] No REST credentials configured');
    return null;
  }

  try {
    const { Redis } = await import('@upstash/redis');
    const client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    
    console.log('[Redis HTTP] Client created successfully');
    return client;
  } catch (error: any) {
    console.error('[Redis HTTP] Failed to create client:', error.message);
    return null;
  }
};