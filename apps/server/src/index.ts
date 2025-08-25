import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

const allowedOrigins = [
  'https://bun-app-client.fly.dev',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
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
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
      maxAge: 86400, // 24 hours
      preflight: true
    })
  )
  .get('/api/health', () => {
    return {
      status: 'ok',
      message: 'Server is running!'
    };
  })
  .get('/api/hello', ({ query: { name } }) => {
    return { message: `Hello ${name || 'World'}!` };
  })
  .listen({
    port: Number(process.env.PORT) || 3001
  })

console.log(`🦊 Elysia is running at http://localhost:${app.server?.port}`)

export type App = typeof app
