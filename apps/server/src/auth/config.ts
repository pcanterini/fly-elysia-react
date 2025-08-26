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
  // Enhanced security configuration
  advanced: {
    useSecureCookies: isProduction,
    crossSubDomainCookies: {
      enabled: false // Disable unless using subdomains
    },
    ipAddress: {
      // Track IP for security (important for rate limiting and suspicious activity)
      ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for', 'x-real-ip'],
      disableIpTracking: false
    },
    cookies: {
      session_token: {
        name: "better-auth.session_token",
        attributes: {
          httpOnly: true,
          sameSite: isProduction ? 'none' as const : 'lax' as const,
          secure: isProduction,
          path: '/',
          // Add max-age for additional security
          ...(isProduction && { maxAge: 60 * 60 * 24 * 7 }) // 7 days
        }
      }
    },
    defaultCookieAttributes: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' as const : 'lax' as const
    }
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  trustedOrigins: [
    'https://bun-app-client.fly.dev',
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