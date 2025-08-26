// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    SIGN_IN: '/api/auth/sign-in/email',
    SIGN_UP: '/api/auth/sign-up/email',
    SIGN_OUT: '/api/auth/sign-out',
    SESSION: '/api/auth/session',
  },
  HEALTH: '/api/health',
  JOBS: {
    LIST: '/api/jobs',
    CREATE: '/api/jobs',
    GET: (id: string) => `/api/jobs/${id}` as const,
    ACTION: (id: string) => `/api/jobs/${id}/action` as const,
    STATS: '/api/jobs/stats',
  },
} as const;

// Error codes
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
} as const;

// HTTP Status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
} as const;

// Validation rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 255,
} as const;
