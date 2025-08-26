import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { auth } from './auth/config'
import { securityHeaders } from './middleware/security'
import { apiRateLimit, authRateLimit } from './middleware/rateLimit'
import { HealthResponse } from '@my-app/shared'

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
  .get('/api/health', (): HealthResponse => {
    return {
      status: 'ok',
      message: 'Server is running!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
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
      .all('*', async ({ request }) => {
        return await auth.handler(request);
      })
  )
  .listen({
    port: Number(process.env.PORT) || 3001
  })

console.log(`🦊 Elysia is running at http://localhost:${app.server?.port}`)

export type App = typeof app
