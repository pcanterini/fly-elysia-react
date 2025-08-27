# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-08-27

### Fixed
- **Authentication Cookie Issues in Production**
  - Fixed cookies being set with localhost domain in production
  - Client now makes direct CORS requests to server (no proxy)
  - Added runtime API URL detection based on hostname
  - Proper cookie configuration with `.fly.dev` domain for production
  - SameSite=none and Secure flags properly set for cross-origin auth
  - Removed Caddy reverse proxy for `/api/*` routes to avoid cookie domain conflicts

### Changed
- **Client API Configuration**
  - Added runtime environment detection in `apps/client/src/lib/api.ts`
  - Client automatically uses correct server URL based on hostname
  - Removed dependency on build-time VITE_API_URL environment variable

- **Documentation Updates**
  - Added Authentication Architecture section to CLAUDE.md
  - Added Deployment Requirements section with required Fly secrets
  - Updated API Communication section to reflect direct CORS approach
  - Added Security Considerations for cross-origin authentication

### Security
- Enhanced cookie security configuration for production
- Ensured proper domain, secure, and SameSite attributes for auth cookies
- Direct API calls prevent cookie manipulation through proxy

## [Unreleased] - 2024-01-26

### Added

- **Testing Infrastructure**
  - Vitest unit testing setup with happy-dom
  - Test utilities and setup for React Testing Library
  - Unit tests for API client and AuthContext
  - Playwright E2E testing configuration
  - Comprehensive E2E tests for authentication flow
  - E2E tests for application health and basic functionality
  - Test scripts in package.json (test, test:ui, test:e2e)

### Added
- **Shared Types Package** (`@my-app/shared`)
  - Centralized type definitions for User, Session, API responses
  - Shared constants for API endpoints, error codes, HTTP status codes
  - Validation rules and form state types
  - Eliminates type duplication between client and server

- **Security Enhancements**
  - Comprehensive security headers middleware (OWASP recommendations)
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - X-XSS-Protection: 1; mode=block
    - Strict-Transport-Security (HSTS) in production
    - Referrer-Policy and Permissions-Policy
  - Rate limiting implementation
    - General API: 100 requests/minute
    - Auth endpoints: 5 requests/15 minutes
    - In-memory store with automatic cleanup
  - Better-auth security configuration
    - Multi-session support (max 5 sessions per user)
    - IP address tracking for security monitoring
    - Enhanced cookie security with proper SameSite/Secure attributes
    - Session caching and refresh strategies

- **API Client Architecture**
  - Centralized API client (`apps/client/src/lib/api.ts`)
  - Typed API methods for all endpoints
  - Custom error class with proper error handling
  - React Query key factory for consistent cache management
  - Network error handling and retry logic

- **Development Infrastructure**
  - Separate Docker configurations for development and production
  - `Dockerfile.dev` for local development without NODE_ENV at build time
  - Proper workspace package support in Docker builds
  - Volume mounts for hot reloading in development

### Changed
- **TypeScript Improvements**
  - Fixed type-only imports for better tree-shaking
  - Removed type assertions in AuthContext
  - Improved User type to handle both Date objects and ISO strings
  - Proper error types and API response types

- **Project Structure**
  - Added `packages/` directory for shared code
  - Created `middleware/` directory in server for modular middleware
  - Organized imports to use workspace packages

- **Authentication Configuration**
  - Enhanced Better-auth configuration with production-ready settings
  - Proper trusted origins configuration for development and production
  - Cookie configuration that works across different environments
  - Added environment variable validation

- **Client Code Quality**
  - HomePage now uses centralized API client
  - AuthContext simplified and properly typed
  - TanStack Query used appropriately for data fetching
  - Removed API URL duplication across components

### Fixed
- **Cookie Configuration**
  - Fixed cross-origin cookie issues in production
  - Proper SameSite and Secure attributes based on environment
  - NODE_ENV correctly evaluated at build time in Docker
  - Development cookies work properly with localhost
  - Removed duplicate cookies caused by multiSession plugin

- **Docker Build Issues**
  - Fixed workspace dependency resolution in Docker
  - Proper copying of shared packages during build
  - Correct build order and dependency installation

- **TypeScript Errors**
  - Fixed verbatimModuleSyntax compatibility issues
  - Corrected type imports to use `import type` where needed
  - Fixed User type to match Better-auth's actual return types
  - Fixed all TypeScript errors in middleware and main server file

### Security
- Added comprehensive security headers to all API responses
- Implemented rate limiting to prevent abuse
- Enhanced session security with multi-session limits
- IP tracking for security monitoring

### Documentation
- Created comprehensive README with project overview
- Added IMPROVEMENTS.md with future enhancement roadmap
- Updated COOKIE_FIX.md with local development setup
- Added detailed inline documentation for complex configurations

## [1.0.0] - 2024-01-20

### Initial Release
- Full-stack TypeScript application with React frontend and Elysia backend
- Better-auth authentication system
- PostgreSQL database with Drizzle ORM
- Fly.io deployment configuration
- Docker support for local development
- TanStack Query for state management
- Terminal.css for retro styling