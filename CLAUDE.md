# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with projects created from this template.

## Template Overview

This is a full-stack TypeScript template with a React frontend and Elysia (Bun) backend, ready for deployment on Fly.io.

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
Local development can use Redis with or without password:
- Redis URL is configured in `apps/server/.env`
- Docker Compose automatically starts Redis
- For production, use a managed Redis service like Upstash

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

### Docker Commands
```bash
# Development with hot reload
bun run docker:dev
bun run docker:dev:down

# Production build
bun run docker:prod
bun run docker:prod:down
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
- **Production**: Client makes direct CORS requests to the server URL (configurable)
- **No proxy**: The client does NOT proxy API requests through Caddy
- **Runtime detection**: The client detects the environment at runtime (`apps/client/src/lib/api.ts`)
  - If not localhost, derives server URL from hostname pattern
  - Otherwise defaults to localhost for development
- Centralized API client in `apps/client/src/lib/api.ts`
- Typed API methods using shared types from `@my-app/shared` (rename this package for your project)

### Authentication Architecture
- **Library**: better-auth with PostgreSQL adapter
- **Session storage**: Uses localStorage on client for cross-origin compatibility
- **Cookie configuration** (Production):
  - Domain: Your deployment domain (e.g., `.fly.dev` for Fly.io)
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
- Production: Your deployed client URL
- Development: Various localhost ports (3000, 4173, 5173, 5174)
- Credentials: `include` for cookie-based authentication

### Fly.io Configuration
- Client app: `YOUR-APP-NAME-client` (256MB RAM, port 80)
- Server app: `YOUR-APP-NAME-server` (256MB RAM, port 3001)
- Both configured with auto start/stop for cost optimization
- Update app names in fly.*.toml files before deployment

## Deployment Requirements

### Required Fly Secrets
Set these secrets for the server app using `fly secrets set --app YOUR-APP-server`:
- `BETTER_AUTH_SECRET`: Random secret key for auth (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL`: Must be set to `https://YOUR-APP-server.fly.dev`
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis/Upstash connection string for job queues

### Security Considerations
- **Cross-origin authentication**: Requires proper CORS and cookie configuration
- **Cookie security**: In production, cookies must have:
  - `Secure` flag for HTTPS-only transmission
  - `SameSite=none` for cross-origin requests
  - Proper domain (`.fly.dev`) for cross-subdomain access
- **Direct API calls**: Client bypasses proxy for auth to avoid cookie domain issues

## Template Customization Guide

### Initial Setup for New Projects

When someone clones this template:

1. **Run initialization script**: `./scripts/init.sh`
2. **Update package names**: Change `@my-app/shared` to match project
3. **Configure environment**: Set up `.env` files from examples
4. **Customize branding**: Update app name, colors, styles

### Common Customizations

#### Changing the App Name
- Update `package.json` files
- Update Fly.io config files (`fly.*.toml`)
- Update shared package name
- Update import statements

#### Adding New Features
- Create feature in appropriate location
- Add types to `packages/shared`
- Update API endpoints
- Add frontend components
- Update documentation

#### Database Schema Changes
1. Modify `apps/server/src/db/schema.ts`
2. Generate migration: `bun run db:generate`
3. Apply changes: `bun run db:push`

### Best Practices for Template Users

1. **Keep dependencies updated**: Run `bun update` regularly
2. **Follow the established patterns**: Don't restructure without good reason
3. **Document your changes**: Update README as you add features
4. **Test before deploying**: Always test locally first
5. **Use environment variables**: Never hardcode sensitive data

## Development Tips

### Performance Optimization
- Use React.memo for expensive components
- Implement virtual scrolling for long lists
- Use database indexes appropriately
- Cache frequently accessed data in Redis

### Security Best Practices
- Validate all user inputs
- Use parameterized queries
- Implement rate limiting
- Keep dependencies updated
- Use HTTPS in production

### Testing Strategy
- Unit test business logic
- Integration test API endpoints
- E2E test critical user flows
- Test error handling

## Troubleshooting Guide

### Common Issues and Solutions

**Build fails with type errors**
```bash
bun run typecheck
# Fix reported issues
```

**Authentication not working**
- Check BETTER_AUTH_SECRET is set
- Verify BETTER_AUTH_URL matches deployment
- Check cookie settings for production

**Database migrations fail**
```bash
cd apps/server
bun run db:studio  # Check current schema
bun run db:generate  # Generate fresh migration
```

**Deployment fails**
- Check all secrets are set: `fly secrets list --app YOUR-APP`
- Review logs: `fly logs --app YOUR-APP`
- Verify build works locally first

## Resources

### Project Documentation
- [Template Documentation](./README.md)
- [Setup Guide](./SETUP.md)
- [Project Structure](./PROJECT_STRUCTURE.md)
- [Docker Guide](./docs/DOCKER.md)
- [Contributing Guidelines](./CONTRIBUTING.md)

### External Documentation
- [Bun Documentation](https://bun.sh/docs)
- [Elysia Documentation](https://elysiajs.com)
- [Better-Auth Documentation](https://better-auth.com)
- [Fly.io Documentation](https://fly.io/docs)
- [TanStack Query](https://tanstack.com/query)
- [Drizzle ORM](https://orm.drizzle.team)