import { Elysia } from 'elysia';
import { ApiError } from '../types/api';

export const errorMiddleware = new Elysia({ name: 'error-middleware' })
  .error({
    API_ERROR: ApiError,
    VALIDATION_ERROR: Error,
    NOT_FOUND: Error,
    UNAUTHORIZED: Error,
    FORBIDDEN: Error
  })
  .onError(({ code, error, set, request }) => {
    const timestamp = new Date().toISOString();
    
    // Log error details (in production, use proper logging service)
    console.error(`[${timestamp}] ${request.method} ${request.url} - Error:`, {
      code,
      message: error.message,
      stack: error.stack
    });

    switch (code) {
      case 'API_ERROR':
        if (error instanceof ApiError) {
          set.status = error.statusCode;
          return error.toResponse();
        }
        break;
      
      case 'VALIDATION':
        set.status = 400;
        return {
          success: false as const,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.message,
          timestamp
        };
      
      case 'NOT_FOUND':
        set.status = 404;
        return {
          success: false as const,
          error: 'Resource not found',
          code: 'NOT_FOUND',
          timestamp
        };
      
      case 'PARSE':
        set.status = 400;
        return {
          success: false as const,
          error: 'Invalid request format',
          code: 'PARSE_ERROR',
          timestamp
        };
      
      default:
        // Handle unexpected errors
        set.status = 500;
        return {
          success: false as const,
          error: process.env.NODE_ENV === 'development' 
            ? error.message 
            : 'Internal server error',
          code: 'INTERNAL_ERROR',
          timestamp
        };
    }
  });