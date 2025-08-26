import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { auth } from './auth/config'
import { securityHeaders } from './middleware/security'
import { apiRateLimit, authRateLimit } from './middleware/rateLimit'
import { testDatabaseConnection } from './db'
import { queueService } from './queue/service'
import { startExampleWorker, stopExampleWorker } from './queue/workers/example.worker'
import type { HealthResponse, CreateJobRequest, JobAction } from '@my-app/shared'

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
  // Job queue endpoints
  .group('/api/jobs', (app) =>
    app
      // Get queue statistics
      .get('/stats', async () => {
        try {
          const stats = await queueService.getQueueStats();
          return stats;
        } catch (error) {
          console.error('Error fetching queue stats:', error);
          throw error;
        }
      })
      // List jobs with pagination
      .get('/', async ({ query }) => {
        try {
          const page = Number(query.page) || 1;
          const pageSize = Number(query.pageSize) || 20;
          const states = query.states ? query.states.split(',') : undefined;
          
          const response = await queueService.getJobs(page, pageSize, states as any);
          return response;
        } catch (error) {
          console.error('Error fetching jobs:', error);
          throw error;
        }
      })
      // Create a new job
      .post('/', async ({ body, set }) => {
        try {
          const jobData = body as CreateJobRequest;
          const job = await queueService.createJob(jobData);
          set.status = 201;
          return { job };
        } catch (error) {
          console.error('Error creating job:', error);
          set.status = 500;
          return {
            error: 'Failed to create job',
            message: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
      // Get a single job by ID
      .get('/:id', async ({ params, set }) => {
        try {
          const job = await queueService.getJob(params.id);
          if (!job) {
            set.status = 404;
            return {
              error: 'Job not found',
              message: `Job with ID ${params.id} does not exist`
            };
          }
          return { job };
        } catch (error) {
          console.error('Error fetching job:', error);
          throw error;
        }
      })
      // Perform action on a job (retry, remove, promote)
      .post('/:id/action', async ({ params, body, set }) => {
        try {
          const action = body as JobAction;
          const response = await queueService.performJobAction(params.id, action.action);
          
          if (!response.success) {
            set.status = 400;
          }
          
          return response;
        } catch (error) {
          console.error('Error performing job action:', error);
          set.status = 500;
          return {
            success: false,
            message: error instanceof Error ? error.message : 'Action failed'
          };
        }
      })
  )
  .listen({
    port: Number(process.env.PORT) || 3001
  })

console.log(`🦊 Elysia is running at http://localhost:${app.server?.port}`)

// Start the queue worker if not explicitly disabled
if (process.env.RUN_WORKERS !== 'false') {
  startExampleWorker();
  console.log('🔧 Queue worker started');
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await stopExampleWorker();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  await stopExampleWorker();
  process.exit(0);
});

export type App = typeof app
