import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';

// Utilities
import { getConfig } from './utils/env';
import { logger } from './utils/logger';

// Middleware imports
import { errorMiddleware } from './middleware/error';
import { securityMiddleware } from './middleware/security';

// Feature imports
import { healthController } from './features/health/controller';
import { userController } from './features/user/controller';

// Auth imports
import { auth } from './auth/config';

// Services
import { HealthService } from './features/health/service';

// Load and validate configuration
const config = getConfig();
logger.info('Server configuration loaded', { 
  environment: config.NODE_ENV,
  port: config.PORT
});

// Validate dependencies on startup
try {
  await HealthService.validateDependencies();
  logger.info('All system dependencies validated successfully');
} catch (error) {
  logger.error('Dependency validation failed', error);
  process.exit(1);
}

const app = new Elysia({ 
  name: 'fly-elysia-server',
  serve: {
    hostname: '0.0.0.0', // Important for containers
  }
})
  // Request logging middleware
  .derive({ as: 'scoped' }, ({ request }) => {
    const startTime = Date.now();
    return {
      startTime,
      logRequest: (statusCode: number) => {
        const duration = Date.now() - startTime;
        logger.http(
          request.method,
          new URL(request.url).pathname,
          statusCode,
          duration
        );
      }
    };
  })
  // Apply middleware in correct order
  .use(errorMiddleware)
  .use(securityMiddleware)
  
  // API Documentation (only in development)
  .use(!config.isProduction ? swagger({
    documentation: {
      info: {
        title: 'Fly Elysia React API',
        version: '1.0.0',
        description: 'RESTful API for the Fly Elysia React application'
      },
      tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Auth', description: 'Authentication endpoints' }
      ],
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Development server'
        },
        {
          url: 'https://bun-app-server.fly.dev',
          description: 'Production server'
        }
      ]
    },
    path: '/docs'
  }) : new Elysia())

  // Apply versioning
  .group('/api/v1', (app) =>
    app
      .use(healthController)
      .use(userController)
      // Add other v1 controllers here
  )
  
  // Legacy endpoints for backward compatibility
  .get('/api/health', ({ redirect }) => {
    return redirect('/api/v1/health', 301);
  })

  .get('/api/hello', ({ query: { name } }) => {
    return { 
      message: `Hello ${name || 'World'}!`,
      timestamp: new Date().toISOString(),
      version: 'v1'
    };
  }, {
    detail: {
      deprecated: true,
      summary: 'Legacy Hello Endpoint',
      description: 'This endpoint is deprecated. Use versioned endpoints instead.'
    }
  })

  // Authentication endpoints
  .all('/api/auth/*', async ({ request }) => {
    return await auth.handler(request);
  })

  // Global 404 handler
  .get('*', ({ set }) => {
    set.status = 404;
    return {
      success: false,
      error: 'Endpoint not found',
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString()
    };
  })

  .listen({
    port: config.PORT,
    hostname: '0.0.0.0'
  });

logger.info('🦊 Elysia server is running!', {
  port: config.PORT,
  environment: config.NODE_ENV,
  documentation: !config.isProduction ? `http://localhost:${config.PORT}/docs` : 'Disabled in production'
});

export type App = typeof app;
export { app };