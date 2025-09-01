# Docker Configuration Guide

This project includes comprehensive Docker support for both development and production environments.

## Docker Files Overview

### Docker Compose Files

- **`docker-compose.yml`** - Development environment with hot reloading
- **`docker-compose.prod.yml`** - Production-optimized configuration

### Dockerfiles

#### Client
- **`apps/client/Dockerfile`** - Production build with Nginx
- **`apps/client/Dockerfile.dev`** - Development with Vite hot reload

#### Server
- **`apps/server/Dockerfile`** - Production build optimized for Bun
- **`apps/server/Dockerfile.dev`** - Development with file watching

## Development Setup

### Quick Start with Docker

```bash
# Start all services (databases, backend, frontend)
bun run docker:dev

# Access the application
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
# PostgreSQL: localhost:5432
# Redis: localhost:6379

# View logs
docker-compose logs -f

# Stop all services
bun run docker:dev:down
```

### Development Features

- **Hot Reloading**: Source code is mounted as volumes
- **Database Persistence**: Data persists between restarts
- **Health Checks**: Services wait for dependencies
- **Network Isolation**: Services communicate on internal network

### Using Only Databases

If you prefer to run the application locally but use Docker for databases:

```bash
# Start only PostgreSQL and Redis
docker-compose up -d postgres redis

# Run application locally
bun run dev
```

## Production Setup

### Running Production Build

```bash
# Start production stack
bun run docker:prod

# Services available at:
# Frontend: http://localhost:80
# Backend: http://localhost:3001

# Stop production stack
bun run docker:prod:down
```

### Production Features

- **Optimized Builds**: Multi-stage builds for smaller images
- **Security**: No source code in containers
- **Health Checks**: Automated health monitoring
- **Restart Policies**: Auto-restart on failures
- **Resource Limits**: Controlled resource usage

## Environment Variables

### Development (.env)

```env
# Database
DB_NAME=your_database_name
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_PASSWORD=dev-redis-password

# Application
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3001
```

### Production

Use actual environment variables or Docker secrets:

```bash
# Set environment variables
export DATABASE_URL=postgresql://...
export REDIS_URL=redis://...
export BETTER_AUTH_SECRET=...

# Run with env vars
docker-compose -f docker-compose.prod.yml up
```

## Docker Commands Reference

### Building Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build server

# Build with no cache
docker-compose build --no-cache
```

### Managing Containers

```bash
# Start services
docker-compose up -d

# Stop services (keep volumes)
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart a service
docker-compose restart server

# View running containers
docker-compose ps

# Execute command in container
docker-compose exec server sh
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server

# Last 100 lines
docker-compose logs --tail=100 server
```

### Database Operations

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres

# Backup database
docker-compose exec postgres pg_dump -U postgres your_database > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres your_database < backup.sql

# Access Redis CLI
docker-compose exec redis redis-cli -a your-password
```

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Check what's using the port
lsof -i :3001

# Stop all containers
docker-compose down

# Remove all containers
docker container prune
```

#### Database Connection Issues

```bash
# Check if database is running
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

#### Build Failures

```bash
# Clean Docker system
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check disk space
df -h
```

#### Permission Issues

```bash
# Fix volume permissions (Linux)
sudo chown -R $USER:$USER .

# Reset Docker
docker-compose down -v
docker-compose up -d
```

## Best Practices

### Development

1. Use volumes for source code mounting
2. Enable hot reloading for faster development
3. Use health checks to ensure service availability
4. Keep development and production configs separate

### Production

1. Use multi-stage builds to minimize image size
2. Never include source code in production images
3. Use specific version tags for base images
4. Implement proper health checks
5. Set resource limits
6. Use secrets management for sensitive data

### Security

1. Don't use root user in containers
2. Keep base images updated
3. Scan images for vulnerabilities
4. Use read-only filesystems where possible
5. Limit network exposure

## Docker Compose Override

Create `docker-compose.override.yml` for local customizations:

```yaml
# docker-compose.override.yml
services:
  server:
    environment:
      - DEBUG=true
    ports:
      - "9229:9229"  # Node.js debugging
```

This file is automatically loaded and not tracked by git.

## Deployment with Docker

### Using Docker in Production

While this template is optimized for Fly.io deployment, you can also deploy using Docker:

1. **Build production images**:
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. **Push to registry**:
   ```bash
   docker tag your-app-server your-registry/your-app-server
   docker push your-registry/your-app-server
   ```

3. **Deploy to your infrastructure**:
   - Use Docker Swarm
   - Use Kubernetes
   - Use Docker Compose on a VPS

## Monitoring

### Health Checks

All services include health checks:

```bash
# Check health status
docker-compose ps

# View health check logs
docker inspect --format='{{json .State.Health}}' container_name
```

### Resource Usage

```bash
# View resource usage
docker stats

# View specific container
docker stats server
```

## Cleanup

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a --volumes
```