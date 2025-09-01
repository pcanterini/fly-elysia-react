# Server Application

Elysia backend API server running on Bun runtime.

## Architecture

- **Runtime**: Bun for fast performance
- **Framework**: Elysia for type-safe APIs
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better-Auth
- **Queue**: BullMQ with Redis
- **Validation**: Built-in Elysia type validation

## Project Structure

```
src/
├── auth/         # Authentication configuration
├── db/           # Database schema and configuration
├── middleware/   # Request middleware (CORS, security)
├── queue/        # Job queue system
├── routes/       # API route handlers
├── types/        # TypeScript type definitions
├── utils/        # Utility functions
├── index.ts      # Main server entry point
└── worker.ts     # Background job worker
```

## Key Files

- `index.ts` - Main server with all route definitions
- `db/schema.ts` - Database schema definitions
- `auth/config.ts` - Authentication configuration
- `queue/service.ts` - Job queue setup
- `worker.ts` - Background job processor

## Development

```bash
# Run development server with hot reload
bun run dev

# Run worker process
bun run dev:worker

# Build for production
bun run build

# Start production server
bun run start

# Run type checking
bun run typecheck
```

## Database

```bash
# Open Drizzle Studio (GUI)
bun run db:studio

# Generate migrations
bun run db:generate

# Push schema changes
bun run db:push

# Run migrations
bun run db:migrate
```

## Environment Variables

Required in `.env`:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Authentication
BETTER_AUTH_SECRET=min-32-character-secret-key
BETTER_AUTH_URL=http://localhost:3001

# Redis (for job queues)
REDIS_URL=redis://localhost:6379

# Workers
RUN_WORKERS=true

# Environment
NODE_ENV=development
```

## API Endpoints

### Authentication
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-out` - User logout
- `GET /api/auth/session` - Get current session

### Health & Status
- `GET /api/health` - Health check
- `GET /api/stats` - System statistics

### Jobs (Example)
- `POST /api/jobs` - Create job
- `GET /api/jobs` - List jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/:id/:action` - Job actions (retry, remove)

## Queue System

Uses BullMQ for background jobs:
- Redis-backed job queue
- Separate worker process
- Job retry and failure handling
- Real-time job status updates

## Security

- CORS configuration for cross-origin requests
- Rate limiting on sensitive endpoints
- Input validation with Elysia's type system
- Secure session handling with Better-Auth
- Environment-based configuration

## Testing

```bash
# Run tests
bun test

# Run with coverage
bun test --coverage
```

## Docker

```bash
# Development with hot reload
docker build -f Dockerfile.dev -t server-dev .
docker run -p 3001:3001 server-dev

# Production build
docker build -f Dockerfile -t server-prod .
docker run -p 3001:3001 server-prod
```

## Deployment

Configured for deployment to:
- Fly.io (via fly.server.toml)
- Docker containers
- Any Node.js/Bun hosting platform

## Performance

- Bun runtime for fast startup
- Connection pooling for database
- Redis caching for sessions
- Optimized Docker images
- Health checks for monitoring

## Monitoring

Built-in endpoints for monitoring:
- `/api/health` - Basic health check
- `/api/stats` - Detailed statistics
- Structured logging
- Error tracking ready