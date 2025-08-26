import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '../db';

const isProduction = process.env.NODE_ENV === 'production';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  // Cookie configuration for cross-origin authentication
  advanced: {
    useSecureCookies: isProduction,
    cookies: {
      session_token: {
        name: "better-auth.session_token",
        attributes: {
          httpOnly: true,
          // Cross-origin cookies require SameSite=None and Secure=true
          sameSite: isProduction ? 'none' as const : 'lax' as const,
          secure: isProduction,
          path: '/',
        }
      }
    }
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  trustedOrigins: [
    'https://bun-app-client.fly.dev',
    'http://localhost',        // Docker client on port 80
    'http://localhost:80',     // Docker client on port 80 (explicit)
    'http://localhost:5173',   // Vite dev server
    'http://localhost:5174',   // Vite dev server (alternate)
    'http://localhost:3000',   // Alternative dev port
    'http://localhost:4173',   // Vite preview
  ],
});