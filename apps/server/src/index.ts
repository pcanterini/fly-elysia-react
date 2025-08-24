import { Elysia } from 'elysia'

const app = new Elysia()
  .get('/api/health', () => ({ status: 'ok', message: 'Server is running!' }))
  .get('/api/hello', ({ query: { name } }) => ({
    message: `Hello ${name || 'World'}!`
  }))
  .listen(3001)

console.log(`🦊 Elysia is running at http://localhost:${app.server?.port}`)

export type App = typeof app
