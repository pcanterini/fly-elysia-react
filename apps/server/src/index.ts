import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { auth } from './auth/config'

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
  .get('/api/health', () => {
    return {
      status: 'ok',
      message: 'Server is running!',
      timestamp: new Date().toISOString()
    };
  })
  .get('/api/hello', ({ query: { name } }) => {
    return { message: `Hello ${name || 'World'}!` };
  })
  .all('/api/auth/*', async ({ request }) => {
    return await auth.handler(request);
  })
  .listen({
    port: Number(process.env.PORT) || 3001
  })

console.log(`🦊 Elysia is running at http://localhost:${app.server?.port}`)

export type App = typeof app
