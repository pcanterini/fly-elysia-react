import { API_ENDPOINTS } from '@my-app/shared';
import type { 
  ApiError,
  HealthResponse,
  AuthResponse,
  SignInRequest,
  SignUpRequest,
  Job,
  CreateJobRequest,
  JobListResponse,
  QueueStats,
  JobActionResponse
} from '@my-app/shared';

// API configuration
export const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3001'
  : import.meta.env.VITE_API_URL || 'https://bun-app-server.fly.dev';

// Custom error class for API errors
export class ApiClientError extends Error {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// API client configuration
interface RequestConfig extends Omit<RequestInit, 'body'> {
  body?: unknown;
  params?: Record<string, string>;
}

// Generic API request handler
async function request<T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> {
  const { body, params, ...options } = config;

  // Build URL with query params
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  // Default options
  const requestOptions: RequestInit = {
    ...options,
    credentials: 'include', // Always include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Add body if present
  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url.toString(), requestOptions);
    
    // Handle non-2xx responses
    if (!response.ok) {
      let errorData: ApiError;
      try {
        errorData = await response.json();
      } catch {
        errorData = {
          code: 'UNKNOWN_ERROR',
          message: `HTTP error! status: ${response.status}`,
          statusCode: response.status,
        };
      }
      
      throw new ApiClientError(
        errorData.message || 'An error occurred',
        errorData.statusCode || response.status,
        errorData.code || 'API_ERROR',
        errorData.details
      );
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    // Re-throw ApiClientError
    if (error instanceof ApiClientError) {
      throw error;
    }

    // Handle network errors
    if (error instanceof Error) {
      throw new ApiClientError(
        error.message || 'Network error',
        0,
        'NETWORK_ERROR'
      );
    }

    throw new ApiClientError(
      'An unexpected error occurred',
      0,
      'UNKNOWN_ERROR'
    );
  }
}

// API client with typed endpoints
export const api = {
  // GET request
  get: <T>(endpoint: string, config?: RequestConfig) => 
    request<T>(endpoint, { ...config, method: 'GET' }),

  // POST request
  post: <T>(endpoint: string, body?: unknown, config?: RequestConfig) => 
    request<T>(endpoint, { ...config, method: 'POST', body }),

  // PUT request
  put: <T>(endpoint: string, body?: unknown, config?: RequestConfig) => 
    request<T>(endpoint, { ...config, method: 'PUT', body }),

  // DELETE request
  delete: <T>(endpoint: string, config?: RequestConfig) => 
    request<T>(endpoint, { ...config, method: 'DELETE' }),

  // PATCH request
  patch: <T>(endpoint: string, body?: unknown, config?: RequestConfig) => 
    request<T>(endpoint, { ...config, method: 'PATCH', body }),
};

// Typed API methods for specific endpoints
export const apiClient = {
  health: () => api.get<HealthResponse>(API_ENDPOINTS.HEALTH),
  
  auth: {
    signIn: (data: SignInRequest) => 
      api.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGN_IN, data),
    
    signUp: (data: SignUpRequest) => 
      api.post<AuthResponse>(API_ENDPOINTS.AUTH.SIGN_UP, data),
    
    signOut: () => 
      api.post<void>(API_ENDPOINTS.AUTH.SIGN_OUT),
    
    session: () => 
      api.get<AuthResponse>(API_ENDPOINTS.AUTH.SESSION),
  },

  jobs: {
    create: (data: CreateJobRequest) => 
      api.post<{ job: Job }>(API_ENDPOINTS.JOBS.CREATE, data),
    
    list: (page?: number, pageSize?: number, states?: string[]) => {
      const params: Record<string, string> = {};
      if (page) params.page = page.toString();
      if (pageSize) params.pageSize = pageSize.toString();
      if (states?.length) params.states = states.join(',');
      return api.get<JobListResponse>(API_ENDPOINTS.JOBS.LIST, { params });
    },
    
    get: (id: string) => 
      api.get<{ job: Job }>(API_ENDPOINTS.JOBS.GET(id)),
    
    action: (id: string, action: 'retry' | 'remove' | 'promote') => 
      api.post<JobActionResponse>(API_ENDPOINTS.JOBS.ACTION(id), { action, jobId: id }),
    
    stats: () => 
      api.get<QueueStats>(API_ENDPOINTS.JOBS.STATS),
  },
};

// React Query key factory for consistent cache keys
export const queryKeys = {
  health: ['health'] as const,
  session: ['auth', 'session'] as const,
  user: (id: string) => ['user', id] as const,
} as const;