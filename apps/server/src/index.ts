import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { auth } from './auth/config'
import { securityHeaders } from './middleware/security'
import { apiRateLimit, authRateLimit } from './middleware/rateLimit'
import { testDatabaseConnection } from './db'
import type { HealthResponse } from '@my-app/shared'

const allowedOrigins = [
  'https://bun-app-client.fly.dev',
  'http://localhost', // For client container on port 80
  'http://localhost:80', // Alternative format
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://127.0.0.1',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4173'
]

const app = new Elysia()
  // Apply security headers to all routes
  .use(securityHeaders)
  // Apply general rate limiting
  .use(apiRateLimit)
  // CORS configuration
  .use(
    cors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
      credentials: true,
      maxAge: 86400, // 24 hours
      preflight: true
    })
  )
  // Health check endpoint
  .get('/api/health', async (): Promise<HealthResponse> => {
    const dbHealthy = await testDatabaseConnection();
    return {
      status: dbHealthy ? 'ok' : 'degraded',
      message: dbHealthy ? 'Server is running!' : 'Server running with database issues',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: dbHealthy ? 'connected' : 'disconnected'
    };
  })
  // Example endpoint
  .get('/api/hello', ({ query: { name } }) => {
    return { message: `Hello ${name || 'World'}!` };
  })
  // Auth routes with stricter rate limiting
  .group('/api/auth', (app) =>
    app
      .use(authRateLimit) // Apply auth-specific rate limiting
      .all('*', async ({ request, set }) => {
        try {
          const response = await auth.handler(request);
          return response;
        } catch (error) {
          console.error('Auth handler error:', error);
          
          // Check for specific database connection errors
          if (error instanceof Error) {
            if (error.message.includes('CONNECTION_ENDED') || 
                error.message.includes('CONNECTION_DESTROYED') ||
                error.message.includes('ECONNREFUSED')) {
              set.status = 503;
              return {
                error: 'Database temporarily unavailable',
                message: 'Please try again in a moment',
                code: 'SERVICE_UNAVAILABLE'
              };
            }
          }
          
          // Default error response
          set.status = 500;
          return {
            error: 'Internal server error',
            message: 'An unexpected error occurred',
            code: 'INTERNAL_ERROR'
          };
        }
      })
  )
  .listen({
    port: Number(process.env.PORT) || 3001
  })

console.log(`🦊 Elysia is running at http://localhost:${app.server?.port}`)

export type App = typeof app
