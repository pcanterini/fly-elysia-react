import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';

const isProduction = process.env.NODE_ENV === 'production';

// Validate required environment variables
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error('BETTER_AUTH_SECRET environment variable is required');
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Derive the cookie domain from BETTER_AUTH_URL or use default
// For Fly.io deployments, this would be '.fly.dev' to work across subdomains
const cookieDomain = process.env.COOKIE_DOMAIN || (isProduction ? '.fly.dev' : undefined);


export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: isProduction, // Enable email verification in production
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day - session refreshed daily if used
    freshAge: 60 * 15, // 15 minutes - fresh session for sensitive operations
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5 // 5 minutes - cache session in cookie
    }
  },
  // Cookie configuration at root level
  // NOTE: When deploying to production with custom domains, you may need to update
  // the COOKIE_DOMAIN environment variable to match your domain (e.g., '.yourdomain.com')
  cookies: isProduction ? {
    secure: true, // Force HTTPS in production
    sameSite: 'none' as const, // Required for cross-origin
    httpOnly: true, // Prevent XSS
    path: '/', // Available on all paths
    ...(cookieDomain ? { domain: cookieDomain } : {}), // Dynamic domain configuration
  } : {
    secure: false,
    sameSite: 'lax' as const,
    httpOnly: true,
    path: '/',
  },
  // Enhanced security configuration
  advanced: {
    useSecureCookies: isProduction,
    crossSubDomainCookies: {
      enabled: isProduction && !!cookieDomain // Enable for production with domain
    },
    ipAddress: {
      // Track IP for security (important for rate limiting and suspicious activity)
      ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for', 'x-real-ip'],
      disableIpTracking: false
    }
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  trustedOrigins: [
    // In production, use CLIENT_URL env var or derive from BETTER_AUTH_URL
    ...(isProduction && process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
    ...(isProduction && !process.env.CLIENT_URL && process.env.BETTER_AUTH_URL ? [
      // Derive client URL from server URL (replace -server with -client)
      process.env.BETTER_AUTH_URL.replace('-server', '-client')
    ] : []),
    ...(!isProduction ? [
      'http://localhost',        // Docker client on port 80
      'http://localhost:80',     // Docker client on port 80 (explicit)
      'http://localhost:5173',   // Vite dev server
      'http://localhost:5174',   // Vite dev server (alternate)
      'http://localhost:3000',   // Alternative dev port
      'http://localhost:4173',   // Vite preview
      'http://127.0.0.1:5173',   // IPv4 localhost variations
      'http://127.0.0.1:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:4173'
    ] : [])
  ],
});