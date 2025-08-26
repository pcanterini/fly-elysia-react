import { t } from 'elysia';

// Common response types
export const ApiResponse = {
  success: t.Object({
    success: t.Literal(true),
    data: t.Any(),
    timestamp: t.String()
  }),
  error: t.Object({
    success: t.Literal(false),
    error: t.String(),
    code: t.Optional(t.String()),
    timestamp: t.String()
  })
};

// Health check types
export const HealthModel = {
  response: t.Object({
    status: t.Literal('ok'),
    message: t.String(),
    timestamp: t.String(),
    version: t.Optional(t.String()),
    environment: t.Optional(t.String())
  })
};

// Query parameter types
export const CommonQuery = {
  pagination: t.Object({
    page: t.Optional(t.Numeric({ minimum: 1, default: 1 })),
    limit: t.Optional(t.Numeric({ minimum: 1, maximum: 100, default: 10 }))
  }),
  search: t.Object({
    q: t.Optional(t.String({ minLength: 1 }))
  })
};

// Error types
export class ApiError extends Error {
  public statusCode: number;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }

  toResponse() {
    return {
      success: false as const,
      error: this.message,
      code: this.code,
      timestamp: new Date().toISOString()
    };
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}