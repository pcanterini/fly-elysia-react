import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'

const app = new Elysia()
  .use(
    cors({
      origin: 'https://bun-app-client.fly.dev',
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
