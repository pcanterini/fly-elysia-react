# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a full-stack TypeScript monorepo with a React frontend and Elysia (Bun) backend, deployed on Fly.io.

### Tech Stack
- **Frontend**: React 19 + Vite + TypeScript
  - State management: TanStack Query (React Query)
  - URL state: nuqs
  - Styling: terminal.css
  - Icons: react-icons
- **Backend**: Elysia framework on Bun runtime
  - CORS enabled for development and production origins
  - RESTful API endpoints at `/api/*`
- **Deployment**: Fly.io with separate apps for client and server

### Project Structure
```
/
├── apps/
│   ├── client/         # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── lib/    # API client and auth setup
│   │   │   ├── pages/  # Page components
│   │   │   └── contexts/ # React contexts
│   └── server/         # Elysia backend (Bun)
│       ├── src/
│       │   ├── auth/   # Better-auth configuration
│       │   ├── db/     # Database setup
│       │   └── middleware/ # Security & rate limiting
├── packages/
│   └── shared/         # Shared types and constants
└── *.toml             # Fly.io deployment configs
```

## Development Commands

### Local Development
```bash
# Install dependencies (use bun, not npm)
bun install

# Run both client and server concurrently
bun run dev

# Clean start (kills orphaned processes first)
bun run dev:clean

# Check for running processes/ports
bun run dev:check

# Run individual apps
bun run dev:client    # Frontend on http://localhost:5173
bun run dev:server    # Backend on http://localhost:3001
```

#### Redis Configuration
Local development requires Redis with password authentication:
- Redis URL: `redis://:dev-redis-password-change-in-production@localhost:6379`
- This is configured in `apps/server/.env`
- Docker Compose automatically starts Redis with this password

### Build & Production
```bash
# Build both apps
bun run build

# Build individual apps
bun run build:client
bun run build:server
```

### Code Quality
```bash
# Lint both apps
bun run lint
bun run lint:client
bun run lint:server

# Type checking (server only currently)
bun run typecheck
```

### Deployment
```bash
# Deploy both apps to Fly.io
bun run deploy

# Deploy individual apps
bun run deploy:client
bun run deploy:server
```

## Key Implementation Details

### API Communication
- **Development**: API URL is `http://localhost:3001`
- **Production**: Client makes direct CORS requests to `https://bun-app-server.fly.dev`
- **No proxy**: The client does NOT proxy API requests through Caddy
- **Runtime detection**: The client detects the environment at runtime (`apps/client/src/lib/api.ts`)
  - If hostname includes 'fly.dev', uses production server URL
  - Otherwise defaults to localhost for development
- Centralized API client in `apps/client/src/lib/api.ts`
- Typed API methods using shared types from `@my-app/shared`

### Authentication Architecture
- **Library**: better-auth with PostgreSQL adapter
- **Session storage**: Uses localStorage on client for cross-origin compatibility
- **Cookie configuration** (Production):
  - Domain: `.fly.dev` (allows cross-subdomain access)
  - Secure: `true` (HTTPS only)
  - SameSite: `none` (required for cross-origin)
  - HttpOnly: `true` (prevents XSS)
- **Direct authentication**: Client calls server auth endpoints directly (no proxy)

### React Query Configuration
- Stale time: 5 minutes
- Garbage collection time: 10 minutes
- QueryClient and NuqsAdapter providers wrap the app in `apps/client/src/main.tsx`

### CORS Configuration
The server allows requests from:
- Production: `https://bun-app-client.fly.dev`
- Development: Various localhost ports (3000, 4173, 5173, 5174)
- Credentials: `include` for cookie-based authentication

### Fly.io Apps
- Client app: `bun-app-client` (512MB RAM, port 80)
- Server app: `bun-app-server` (1GB RAM, port 3001)
- Both configured with auto start/stop for cost optimization

## Deployment Requirements

### Required Fly Secrets
Set these secrets for the server app using `fly secrets set --app bun-app-server`:
- `BETTER_AUTH_SECRET`: Random secret key for auth (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL`: Must be set to `https://bun-app-server.fly.dev`
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis/Upstash connection string for job queues

### Security Considerations
- **Cross-origin authentication**: Requires proper CORS and cookie configuration
- **Cookie security**: In production, cookies must have:
  - `Secure` flag for HTTPS-only transmission
  - `SameSite=none` for cross-origin requests
  - Proper domain (`.fly.dev`) for cross-subdomain access
- **Direct API calls**: Client bypasses proxy for auth to avoid cookie domain issues