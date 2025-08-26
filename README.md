# Fly Elysia React

A modern full-stack TypeScript application with React frontend and Elysia backend, deployed on Fly.io.

## 🚀 Tech Stack

### Frontend
- **React 19** with Vite for fast development
- **TypeScript** for type safety
- **TanStack Query** for server state management
- **nuqs** for URL state management
- **terminal.css** for retro terminal styling
- **react-icons** for UI icons

### Backend
- **Elysia** framework on Bun runtime
- **Better-Auth** for authentication
- **Drizzle ORM** with PostgreSQL
- **CORS** configured for production and development

### Infrastructure
- **Fly.io** deployment (separate apps for client and server)
- **PostgreSQL** database
- **Docker** for containerization
- **Bun** as JavaScript runtime and package manager

## 📁 Project Structure

```
.
├── apps/
│   ├── client/          # React frontend (Vite)
│   │   ├── src/
│   │   ├── public/
│   │   └── Dockerfile
│   └── server/          # Elysia backend (Bun)
│       ├── src/
│       ├── Dockerfile     # Production build
│       └── Dockerfile.dev # Development build
├── docs/                # Documentation
├── docker-compose.yml   # Local development setup
└── fly.toml files      # Fly.io deployment configs
```

## 🛠️ Development

### Prerequisites
- [Bun](https://bun.sh) installed locally
- [Docker](https://docker.com) and Docker Compose
- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) for deployments

### Local Development (Without Docker)

```bash
# Install dependencies
bun install

# Start PostgreSQL
docker-compose up postgres -d

# Run both frontend and backend
bun run dev

# Or run individually
bun run dev:client  # Frontend on http://localhost:5173
bun run dev:server  # Backend on http://localhost:3001
```

### Local Development (With Docker)

```bash
# Start the full stack
docker-compose up -d

# View logs
docker-compose logs -f

# Stop everything
docker-compose down
```

Services will be available at:
- Frontend: http://localhost
- Backend: http://localhost:3001
- PostgreSQL: localhost:5432

## 🧪 Testing & Quality

```bash
# Lint code
bun run lint

# Type checking
bun run typecheck

# Build for production
bun run build
```

## 🚢 Deployment

The application is deployed to Fly.io with separate apps for frontend and backend.

### Fly.io Apps
- **Client**: `bun-app-client` - Static React app served by Nginx
- **Server**: `bun-app-server` - Elysia API server
- Both configured with auto start/stop for cost optimization

### Deploy Commands

```bash
# Deploy everything
bun run deploy

# Deploy individually
bun run deploy:client
bun run deploy:server

# Manual deployment
fly deploy --config fly.client.toml  # Client
fly deploy --config fly.server.toml  # Server
```

### Environment Variables

#### Server (Production)
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Authentication secret key
- `BETTER_AUTH_URL` - Auth base URL (https://bun-app-server.fly.dev)
- `NODE_ENV` - Set to "production" at build time

#### Client (Production)
- API URL is configured in `src/lib/api.ts` based on environment

## 🔐 Authentication

The app uses Better-Auth for authentication with:
- Email/password authentication
- Session-based auth with secure cookies
- Cross-origin cookie configuration for production
- Protected routes and API endpoints

## 📝 Database

### Migrations

```bash
# Run database studio
bun run db:studio

# Generate migrations (when schema changes)
cd apps/server
bun run db:generate

# Push schema changes
bun run db:push
```

## 🐳 Docker Details

### Development Setup
- Uses `docker-compose.yml` for local development
- Includes PostgreSQL, server, and client containers
- Volume mounts for hot reloading
- Health checks for service dependencies

### Production Builds
- Multi-stage Docker builds for optimization
- Separate Dockerfiles for development and production
- NODE_ENV handled at build time for proper bundling

## 📚 Additional Documentation

- [Cookie Configuration Fix](docs/COOKIE_FIX.md) - Details on cross-origin authentication setup
- [Claude Instructions](CLAUDE.md) - AI assistant guidance for this codebase

## 🤝 Contributing

1. Follow existing code conventions
2. Use Bun (not npm or yarn) for package management
3. Test locally with Docker before pushing
4. Ensure linting and type checking pass

## 📄 License

Private project - All rights reserved