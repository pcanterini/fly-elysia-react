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

# Run individual apps
bun run dev:client    # Frontend on http://localhost:5173
bun run dev:server    # Backend on http://localhost:3001
```

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
- Development API URL: `http://localhost:3001`
- Production API URL: `https://bun-app-server.fly.dev`
- The client automatically switches based on `import.meta.env.DEV`
- Centralized API client in `apps/client/src/lib/api.ts`
- Typed API methods using shared types from `@my-app/shared`

### React Query Configuration
- Stale time: 5 minutes
- Garbage collection time: 10 minutes
- QueryClient and NuqsAdapter providers wrap the app in `apps/client/src/main.tsx`

### CORS Configuration
The server allows requests from:
- Production: `https://bun-app-client.fly.dev`
- Development: Various localhost ports (3000, 4173, 5173, 5174)

### Fly.io Apps
- Client app: `bun-app-client` (512MB RAM, port 80)
- Server app: `bun-app-server` (1GB RAM, port 3001)
- Both configured with auto start/stop for cost optimization