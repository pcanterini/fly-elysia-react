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
  status: 'ok' | 'error' | 'degraded';
  message: string;
  timestamp: string;
  environment?: string;
  database?: 'connected' | 'disconnected';
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

// Job Queue types
export type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';

export interface Job {
  id: string;
  name: string;
  status: JobStatus;
  progress: number;
  data: Record<string, any>;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
  processedOn?: string;
  finishedOn?: string;
  attempts: number;
  maxAttempts: number;
  userId: string; // User who created the job
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    createdBy?: string;
  };
}

export interface CreateJobRequest {
  name: string;
  data?: Record<string, any>;
  delay?: number; // Max 30 days
  priority?: number; // 0-100
}

export interface JobFilters {
  userId?: string;
  states?: JobStatus[];
  page?: number;
  pageSize?: number;
}

export interface JobListResponse {
  jobs: Job[];
  total: number;
  page: number;
  pageSize: number;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
  total: number;
}

export interface JobAction {
  action: 'retry' | 'remove' | 'promote';
  jobId: string;
}

export interface JobActionResponse {
  success: boolean;
  message: string;
  job?: Job;
}
