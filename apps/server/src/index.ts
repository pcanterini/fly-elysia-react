import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { auth } from './auth/config'
import { securityHeaders } from './middleware/security'
import { apiRateLimit, authRateLimit, createRateLimiter } from './middleware/rateLimit'
import { requireAuth } from './middleware/auth'
import { testDatabaseConnection } from './db'
import { queueService } from './queue/service'
import { startExampleWorker, stopExampleWorker } from './queue/workers/example.worker'
import { initializeQueues } from './queue/lazy-config'
import type { HealthResponse, CreateJobRequest, JobAction } from '@my-app/shared'

const isProduction = process.env.NODE_ENV === 'production';

// Build allowed origins dynamically
const allowedOrigins = [
  // In production, use CLIENT_URL env var or derive from BETTER_AUTH_URL
  ...(isProduction && process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
  ...(isProduction && !process.env.CLIENT_URL && process.env.BETTER_AUTH_URL ? [
    // Derive client URL from server URL (replace -server with -client)
    process.env.BETTER_AUTH_URL.replace('-server', '-client')
  ] : []),
  // Development origins
  ...(!isProduction ? [
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
  ] : [])
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
  // Job queue endpoints with authentication
  .group('/api/jobs', (app) =>
    app
      // Apply authentication middleware to all job routes
      .use(requireAuth)
      // Apply stricter rate limiting for job creation
      .use(createRateLimiter({
        windowMs: 60 * 1000, // 1 minute
        max: 10, // 10 job operations per minute per user
        message: 'Too many job operations, please try again later',
        keyGenerator: (request: Request) => {
          // Rate limit per authenticated user
          const userId = (request as any).userId || 'anonymous';
          return `jobs:${userId}`;
        }
      }))
      // Get queue statistics for current user
      .get('/stats', async (context) => {
        const { set, userId } = context as any;
        
        if (!queueService.isAvailable()) {
          set.status = 503;
          return {
            error: 'Service Unavailable',
            message: 'Queue service is currently unavailable. Redis connection failed.',
            code: 'QUEUE_UNAVAILABLE'
          };
        }
        try {
          const stats = await queueService.getUserQueueStats(userId);
          return stats;
        } catch (error) {
          console.error('Error fetching queue stats:', error);
          throw error;
        }
      })
      // List jobs for current user with pagination
      .get('/', async (context) => {
        const { query, userId, set } = context as any;
        
        try {
          console.log('[Jobs GET /] Using userId from context:', userId);
          
          const page = Number(query.page) || 1;
          const pageSize = Math.min(Number(query.pageSize) || 20, 100); // Max 100 per page
          const states = query.states ? query.states.split(',') : undefined;
          
          const response = await queueService.getUserJobs(userId, page, pageSize, states as any);
          console.log(`[Jobs GET /] Response: ${response.jobs.length} jobs returned`);
          return response;
        } catch (error) {
          console.error('Error fetching jobs:', error);
          throw error;
        }
      })
      // Create a new job with validation and rate limiting
      .post('/', async (context) => {
        const { body, set, request, userId } = context as any;
        
        try {
          console.log('[Jobs POST /] Creating job with userId:', userId);
          const jobData = body as CreateJobRequest;
          
          // Validate job data
          if (!jobData.name || typeof jobData.name !== 'string') {
            set.status = 400;
            return {
              error: 'Invalid job name',
              message: 'Job name is required and must be a string'
            };
          }
          
          // Validate job data size (max 256KB)
          const dataSize = JSON.stringify(jobData.data || {}).length;
          if (dataSize > 256 * 1024) {
            set.status = 400;
            return {
              error: 'Job data too large',
              message: 'Job data must be less than 256KB'
            };
          }
          
          // Validate delay (max 30 days)
          if (jobData.delay && jobData.delay > 30 * 24 * 60 * 60 * 1000) {
            set.status = 400;
            return {
              error: 'Invalid delay',
              message: 'Job delay cannot exceed 30 days'
            };
          }
          
          // Validate priority (0-100)
          if (jobData.priority !== undefined && (jobData.priority < 0 || jobData.priority > 100)) {
            set.status = 400;
            return {
              error: 'Invalid priority',
              message: 'Job priority must be between 0 and 100'
            };
          }
          
          // Extract metadata
          const metadata = {
            ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                       request.headers.get('x-real-ip') || 
                       'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown',
            createdBy: userId
          };
          
          const job = await queueService.createJob({
            ...jobData,
            userId,
            metadata
          });
          
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
      // Get a single job by ID (only if owned by user)
      .get('/:id', async (context) => {
        const { params, set, userId } = context as any;
        try {
          const job = await queueService.getJob(params.id);
          
          if (!job) {
            set.status = 404;
            return {
              error: 'Job not found',
              message: `Job with ID ${params.id} does not exist`
            };
          }
          
          // Check ownership
          if (job.userId !== userId) {
            set.status = 403;
            return {
              error: 'Forbidden',
              message: 'You do not have permission to view this job'
            };
          }
          
          return { job };
        } catch (error) {
          console.error('Error fetching job:', error);
          throw error;
        }
      })
      // Perform action on a job (only if owned by user)
      .post('/:id/action', async (context) => {
        const { params, body, set, userId } = context as any;
        try {
          const action = body as JobAction;
          
          // First check if job exists and user owns it
          const job = await queueService.getJob(params.id);
          
          if (!job) {
            set.status = 404;
            return {
              success: false,
              message: 'Job not found'
            };
          }
          
          if (job.userId !== userId) {
            set.status = 403;
            return {
              success: false,
              message: 'You do not have permission to modify this job'
            };
          }
          
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
console.log('[Server] Starting with queue initialization...')

// Initialize queues on startup
initializeQueues();

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
