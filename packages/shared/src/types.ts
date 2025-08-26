// User types
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: Date | string;  // Can be Date object or ISO string
  updatedAt: Date | string;  // Can be Date object or ISO string
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
}

// Auth types
export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  session: Session;
  redirect?: boolean;
  token?: string;
}

// Health check
export interface HealthResponse {
  status: 'ok' | 'error';
  message: string;
  timestamp: string;
  environment?: string;
}

// Form validation
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T = any> {
  data: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isValid: boolean;
}
