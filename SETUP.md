# Complete Setup & Deployment Guide

This guide will walk you through setting up and deploying your full-stack application from scratch to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Local Development Setup](#local-development-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Deployment to Fly.io](#deployment-to-flyio)
7. [Production Configuration](#production-configuration)
8. [Troubleshooting](#troubleshooting)
9. [Advanced Configuration](#advanced-configuration)

## Prerequisites

### Required Software

- **[Bun](https://bun.sh)** (v1.0+) - JavaScript runtime and package manager
  ```bash
  # Install Bun
  curl -fsSL https://bun.sh/install | bash
  ```

- **[Docker](https://docker.com)** - For local PostgreSQL and Redis
  ```bash
  # Verify Docker installation
  docker --version
  docker-compose --version
  ```

- **[Fly CLI](https://fly.io/docs/flyctl/install/)** - For deployment (optional)
  ```bash
  # macOS
  brew install flyctl
  
  # Linux/WSL
  curl -L https://fly.io/install.sh | sh
  
  # Windows
  powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
  ```

### Recommended Tools

- **Git** - Version control
- **PostgreSQL client** - For database management (optional)
- **VS Code** - With recommended extensions

## Quick Start

The fastest way to get started with this template:

```bash
# 1. Clone the template
git clone https://github.com/yourusername/your-template-repo.git my-app
cd my-app

# 2. Run the initialization script
./scripts/init.sh

# 3. Start development servers
bun run dev

# 4. Open your browser
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

## Local Development Setup

### Step 1: Clone and Initialize

```bash
# Clone the repository
git clone https://github.com/yourusername/your-template-repo.git my-app
cd my-app

# Remove template git history (optional)
rm -rf .git
git init

# Run initialization script
chmod +x scripts/init.sh
./scripts/init.sh
```

### Step 2: Manual Setup (Alternative)

If you prefer manual setup or the script doesn't work:

```bash
# 1. Install dependencies
bun install

# 2. Copy environment files
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env

# 3. Update environment variables
# Edit apps/server/.env with your database credentials
# Generate auth secret: openssl rand -base64 32

# 4. Start Docker services (for databases only)
docker-compose up -d postgres redis
# Or use full Docker setup: bun run docker:dev

# 5. Run database migrations
cd apps/server
bun run db:push
cd ../..

# 6. Start development servers
bun run dev
```

### Step 3: Verify Installation

Check that everything is running:

```bash
# Check running services
docker ps

# Test backend health
curl http://localhost:3001/api/health

# Open frontend
open http://localhost:5173
```

## Environment Configuration

### Server Environment Variables

Create `apps/server/.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/your_db_name

# Authentication
BETTER_AUTH_SECRET=your-32-character-secret-key
BETTER_AUTH_URL=http://localhost:3001

# Redis
REDIS_URL=redis://localhost:6379

# Workers
RUN_WORKERS=true

# Environment
NODE_ENV=development
```

### Client Environment Variables (Optional)

Create `apps/client/.env`:

```env
# API Configuration (optional - defaults in code)
VITE_API_URL=http://localhost:3001

# App Configuration
VITE_APP_NAME=My Application
VITE_APP_VERSION=1.0.0
```

### Generating Secrets

```bash
# Generate auth secret
openssl rand -base64 32

# Generate strong password
openssl rand -hex 16
```

## Database Setup

### Local PostgreSQL with Docker

```bash
# Start PostgreSQL
docker-compose up -d postgres

# Connect to database
docker exec -it fly-elysia-react_postgres_1 psql -U postgres

# Create database manually (if needed)
CREATE DATABASE your_database_name;
```

### Database Migrations

```bash
# Generate migration from schema changes
cd apps/server
bun run db:generate

# Apply migrations
bun run db:push

# Open database studio
bun run db:studio
```

### Using External Database

For production databases (Neon, Supabase, etc.):

1. Create a database on your provider
2. Copy the connection string
3. Update `DATABASE_URL` in your environment

Example connection strings:
```env
# Neon
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Supabase
DATABASE_URL=postgresql://postgres.xxxx:password@aws-0-region.pooler.supabase.com:5432/postgres

# Local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myapp
```

## Deployment to Fly.io

### Automated Setup

Use the provided script for easy setup:

```bash
# Run Fly.io setup script
./scripts/setup-fly.sh

# Follow the prompts to:
# - Create Fly apps
# - Set up database
# - Configure secrets
# - Deploy
```

### Manual Deployment

#### Step 1: Create Fly Apps

```bash
# Login to Fly.io
fly auth login

# Create apps
fly apps create your-app-client
fly apps create your-app-server

# Update fly.toml files with your app names
```

#### Step 2: Set Up Database

Option A: Fly Postgres (Recommended)
```bash
# Create Postgres cluster
fly postgres create --name your-app-db

# Attach to server app
fly postgres attach your-app-db --app your-app-server
```

Option B: External Database
```bash
# Set database URL secret
fly secrets set DATABASE_URL="your-connection-string" --app your-app-server
```

#### Step 3: Configure Secrets

```bash
# Set required secrets for server
fly secrets set --app your-app-server \
  BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  BETTER_AUTH_URL="https://your-app-server.fly.dev" \
  REDIS_URL="redis://default:password@your-redis.upstash.io"
```

#### Step 4: Deploy

```bash
# Deploy both apps
bun run deploy

# Or deploy individually
fly deploy --config fly.client.toml
fly deploy --config fly.server.toml
```

#### Step 5: Verify Deployment

```bash
# Check server status
fly status --app your-app-server

# View logs
fly logs --app your-app-server

# Open apps
fly open --app your-app-client
fly open --app your-app-server
```

## Production Configuration

### Domain Setup

1. Add custom domains:
```bash
fly certs create yourdomain.com --app your-app-client
fly certs create api.yourdomain.com --app your-app-server
```

2. Update DNS records:
   - Point `yourdomain.com` to client app IP
   - Point `api.yourdomain.com` to server app IP

3. Update environment variables:
   - `BETTER_AUTH_URL=https://api.yourdomain.com`
   - `VITE_API_URL=https://api.yourdomain.com`

### Scaling

```bash
# Scale server resources
fly scale vm shared-cpu-2x --memory 512 --app your-app-server

# Add more instances
fly scale count 2 --app your-app-server

# Configure autoscaling
fly autoscale set min=1 max=3 --app your-app-server
```

### Monitoring

```bash
# View metrics
fly dashboard metrics --app your-app-server

# SSH into container
fly ssh console --app your-app-server

# Database backups (if using Fly Postgres)
fly postgres backup list --app your-app-db
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -i :3001
# Kill process
kill -9 <PID>
```

#### Database Connection Failed
```bash
# Check PostgreSQL is running
docker ps
# Restart containers
docker-compose restart
# Check logs
docker-compose logs postgres
```

#### Build Failures
```bash
# Clear cache and rebuild
rm -rf node_modules bun.lockb
bun install
bun run build
```

#### Deployment Failures
```bash
# Check deployment logs
fly logs --app your-app-server

# Check secrets are set
fly secrets list --app your-app-server

# Rollback if needed
fly releases --app your-app-server
fly deploy --image <previous-image> --app your-app-server
```

### Debug Mode

Enable debug logging:

```env
# Server
DEBUG=true
LOG_LEVEL=debug

# Client
VITE_DEBUG=true
```

## Advanced Configuration

### Redis Setup

#### Local Redis with Docker
```bash
# Already included in docker-compose.yml
docker-compose up -d redis
```

#### Production Redis (Upstash)
1. Create account at [Upstash](https://upstash.com)
2. Create Redis database
3. Copy connection URL
4. Set in Fly secrets

### Worker Processes

For high-load applications, run workers separately:

```toml
# fly.server.toml
[processes]
  web = "bun run start:no-workers"
  worker = "bun run worker"

# Scale workers independently
fly scale count web=2 worker=1 --app your-app-server
```

### Health Checks

Configure health check endpoints:

```typescript
// Already configured in server
app.get('/api/health', () => ({
  status: 'healthy',
  timestamp: new Date().toISOString()
}))
```

### Security Headers

Production security headers are configured in:
- `apps/server/src/middleware/security.ts`
- `apps/client/nginx.conf` (for client)

### Backup Strategy

```bash
# Automated backups (Fly Postgres)
fly postgres backup schedule daily --at 03:00 --app your-app-db

# Manual backup
fly postgres backup create --app your-app-db

# Export data
pg_dump $DATABASE_URL > backup.sql
```

## Next Steps

1. **Customize the template** - Update branding, add features
2. **Set up CI/CD** - Configure GitHub Actions for automated deployment
3. **Add monitoring** - Set up error tracking (Sentry) and analytics
4. **Configure backups** - Set up automated database backups
5. **Review security** - Run security audit, configure CSP headers

## Support

- [Documentation](./README.md)
- [Template Repository](https://github.com/yourusername/your-template-repo)
- [Report Issues](https://github.com/yourusername/your-template-repo/issues)

---

Remember to:
- Keep your secrets secure
- Regularly update dependencies
- Monitor your application logs
- Set up proper backups
- Use environment-specific configurations