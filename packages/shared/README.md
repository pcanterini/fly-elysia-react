# Shared Package

Shared types, constants, and utilities used by both client and server applications.

## Purpose

This package ensures type safety across the full stack by providing:
- Shared TypeScript types and interfaces
- API endpoint constants
- Common validation schemas
- Shared utility functions

## Structure

```
src/
├── constants.ts  # Shared constants (API endpoints, etc.)
├── types.ts      # TypeScript type definitions
└── index.ts      # Main exports
```

## Usage

### In Client

```typescript
import { UserType, API_ENDPOINTS } from '@my-app/shared';

// Use shared types
const user: UserType = {
  id: '123',
  email: 'user@example.com',
  name: 'John Doe'
};

// Use shared constants
fetch(API_ENDPOINTS.AUTH.SIGN_IN);
```

### In Server

```typescript
import { UserType, CreateJobRequest } from '@my-app/shared';

// Use same types for API responses
app.post('/api/jobs', ({ body }) => {
  const jobData: CreateJobRequest = body;
  // Process job...
});
```

## Key Exports

### Types
- `UserType` - User model
- `Job` - Job queue model  
- `AuthResponse` - Authentication response
- `ApiError` - Error response format
- Request/Response types for all endpoints

### Constants
- `API_ENDPOINTS` - All API endpoint paths
- Error codes
- Status enums

## Adding New Types

1. Add type definition to `src/types.ts`
2. Export from `src/index.ts`
3. Use in both client and server

Example:
```typescript
// src/types.ts
export interface Product {
  id: string;
  name: string;
  price: number;
}

// src/index.ts
export type { Product } from './types';
```

## Benefits

- **Type Safety**: Single source of truth for types
- **Consistency**: Same types used everywhere
- **Maintainability**: Change once, update everywhere
- **IntelliSense**: Full autocomplete in IDEs
- **Validation**: Shared schemas for validation

## Development

```bash
# Type checking
bun run typecheck

# Build (if needed)
bun run build
```

## Best Practices

1. Keep types simple and focused
2. Use descriptive names
3. Document complex types
4. Avoid circular dependencies
5. Export only what's needed
6. Use enums for fixed values

## Example Types

```typescript
// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Status enums
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
```