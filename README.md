# Full-Stack TypeScript Template

A production-ready full-stack template with React, Elysia (Bun), PostgreSQL, and Redis. Deploy to Fly.io in minutes.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## ✨ Features

- **🚀 Modern Stack**: React 19, Elysia/Bun, TypeScript, PostgreSQL
- **🔐 Authentication**: Complete auth system with Better-Auth
- **📦 Monorepo**: Organized workspace structure with shared types
- **🎨 Styling**: Terminal.css for retro terminal aesthetics
- **🔄 State Management**: TanStack Query + URL state with nuqs
- **👷 Background Jobs**: Redis-based queue system with BullMQ
- **🐳 Docker Ready**: Full Docker Compose setup for local development
- **☁️ Deploy Ready**: Pre-configured for Fly.io deployment
- **🛠️ Developer Experience**: Hot reload, TypeScript, ESLint, scripts

## 🚀 Quick Start

### Local Development
```bash
# Clone and initialize
git clone https://github.com/yourusername/this-template.git my-app
cd my-app
./scripts/init.sh

# Start development
bun run dev

# Open in browser
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

### Deploy to Production
```bash
# 1. Setup Fly.io (interactive script)
./scripts/setup-fly.sh

# 2. Deploy
bun run deploy

# 3. Get DNS records (for custom domains)
./scripts/get-dns-records.sh
```

## 📁 Project Structure

```
.
├── apps/
│   ├── client/          # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── lib/     # API client & utilities
│   │   │   ├── pages/   # Page components
│   │   │   ├── contexts/# React contexts
│   │   │   └── hooks/   # Custom hooks
│   │   └── Dockerfile
│   └── server/          # Elysia backend (Bun)
│       ├── src/
│       │   ├── auth/    # Authentication setup
│       │   ├── db/      # Database & migrations
│       │   ├── queue/   # Job queue system
│       │   └── routes/  # API endpoints
│       └── Dockerfile
├── packages/
│   └── shared/          # Shared types & constants
├── scripts/             # Automation scripts
├── docker-compose.yml   # Local development setup
├── docker-compose.prod.yml # Production setup
└── fly.*.toml          # Fly.io deployment configs
```

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **TanStack Query** - Server state management
- **nuqs** - URL state management
- **terminal.css** - Retro terminal styling
- **react-icons** - Icon library

### Backend
- **Elysia** - Web framework for Bun
- **Bun** - JavaScript runtime
- **Better-Auth** - Authentication
- **Drizzle ORM** - Database toolkit
- **PostgreSQL** - Primary database
- **Redis** - Caching & queues
- **BullMQ** - Job queue management

### DevOps
- **Docker** - Containerization
- **Fly.io** - Deployment platform
- **GitHub Actions** - CI/CD (optional)

## 📚 Documentation

- **[Setup Guide](./SETUP.md)** - Complete setup and deployment instructions
- **[Project Structure](./PROJECT_STRUCTURE.md)** - Directory layout and organization
- **[Docker Guide](./docs/DOCKER.md)** - Docker configuration and usage
- **[Contributing](./CONTRIBUTING.md)** - How to contribute to the project
- **[Environment Variables](./.env.example)** - Configuration reference
- **[Claude Instructions](./CLAUDE.md)** - AI assistant guidance

## 💻 Development

### Prerequisites

- [Bun](https://bun.sh) (v1.0+)
- [Docker](https://docker.com) & Docker Compose
- [Fly CLI](https://fly.io/docs/flyctl/install/) (for deployment)

### Environment Setup

```bash
# Install dependencies
bun install

# Copy environment files
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env

# Start databases
docker-compose up -d postgres redis

# Run migrations
cd apps/server && bun run db:push

# Start development servers
bun run dev
```

### Available Scripts

```bash
# Development
bun run dev           # Start all services
bun run dev:client    # Start frontend only
bun run dev:server    # Start backend only
bun run dev:clean     # Clean start (kills orphaned processes)
bun run dev:check     # Check for port conflicts

# Docker
bun run docker:dev    # Start with Docker (development)
bun run docker:prod   # Start with Docker (production)
bun run docker:dev:down  # Stop Docker development
bun run containers:stop  # Stop all Redis/PostgreSQL containers

# Database
bun run db:studio     # Open Drizzle Studio
bun run db:push       # Push schema changes
bun run db:generate   # Generate migrations
bun run db:migrate    # Run migrations (production)

# Code Quality
bun run lint          # Run ESLint
bun run typecheck     # Run TypeScript checks

# Building
bun run build         # Build for production
bun run build:client  # Build client only
bun run build:server  # Build server only

# Deployment
bun run deploy        # Deploy both to Fly.io
bun run deploy:client # Deploy client only
bun run deploy:server # Deploy server only

# Utility Scripts
./scripts/setup-fly.sh      # Interactive Fly.io setup
./scripts/get-dns-records.sh # Get correct DNS records after deployment
./scripts/fly-scale.sh      # Fix machine scaling
./scripts/init.sh           # Initialize new project
```

## 🚀 Deployment

### Quick Deploy to Fly.io

```bash
# 1. Run automated setup (recommended)
./scripts/setup-fly.sh

# This will guide you through:
# - Creating Fly.io apps
# - Setting up PostgreSQL (Neon or external)
# - Configuring Redis (optional)
# - Setting up custom domains (optional)
# - Deploying your apps

# 2. Deploy your application
bun run deploy

# 3. Verify DNS records (if using custom domain)
./scripts/get-dns-records.sh
```

### Custom Domains

After deployment with custom domains:
1. Run `./scripts/get-dns-records.sh` to get actual IP addresses
2. Add BOTH A (IPv4) and AAAA (IPv6) records - **IPv6 is REQUIRED**
3. Configure CNAME for API subdomain

See [SETUP.md](./SETUP.md) for detailed deployment instructions and [Authentication Guide](./docs/COOKIE_FIX.md) for cookie configuration.

## 📋 Complete Setup Workflow

### From Clone to Production:

1. **Clone & Initialize**
   ```bash
   git clone <template-repo> my-app && cd my-app
   ./scripts/init.sh
   ```

2. **Local Development**
   ```bash
   bun run dev
   # Test at http://localhost:5173
   ```

3. **Fly.io Setup**
   ```bash
   ./scripts/setup-fly.sh
   # Follow prompts for apps, database, Redis, domains
   ```

4. **Deploy**
   ```bash
   bun run deploy
   ```

5. **Configure DNS** (if using custom domain)
   ```bash
   ./scripts/get-dns-records.sh
   # Add shown A and AAAA records to DNS provider
   # BOTH IPv4 and IPv6 are REQUIRED
   ```

6. **Verify**
   ```bash
   fly status --app your-app-client
   fly status --app your-app-server
   ```

## 🔧 Configuration

### Key Environment Variables

**Server** (`apps/server/.env`):
- `DATABASE_URL` - PostgreSQL connection
- `BETTER_AUTH_SECRET` - Auth secret key
- `REDIS_URL` - Redis connection
- `NODE_ENV` - Environment mode
- `COOKIE_DOMAIN` - For custom domains (e.g., `.yourdomain.com`)
- `CLIENT_URL` - Frontend URL for CORS

**Client** (`apps/client/.env`):
- `VITE_API_URL` - Backend URL (optional, auto-detected)
- `VITE_APP_NAME` - Application name

## 📖 API Endpoints

### Authentication
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User login
- `POST /api/auth/sign-out` - User logout
- `GET /api/auth/session` - Get current session

### Health & Status
- `GET /api/health` - Health check
- `GET /api/stats` - Application statistics

### Jobs Queue (Example)
- `POST /api/jobs` - Create job
- `GET /api/jobs` - List jobs
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs/:id/retry` - Retry failed job

## 🏗️ Architecture Decisions

- **Monorepo Structure**: Simplified dependency management and shared code
- **Bun Runtime**: Fast startup, built-in TypeScript, native test runner
- **Elysia Framework**: Type-safe, fast, built for Bun
- **Better-Auth**: Modern auth with good defaults
- **TanStack Query**: Powerful data synchronization
- **Terminal.css**: Unique aesthetic, lightweight, no build step
- **Fly.io**: Simple deployment, good free tier, scales easily

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Bun](https://bun.sh) for the amazing runtime
- [Elysia](https://elysiajs.com) for the web framework
- [Better-Auth](https://better-auth.com) for authentication
- [Terminal.css](https://terminalcss.xyz) for the styling
- [Fly.io](https://fly.io) for hosting

## 📞 Support

- [Create an Issue](https://github.com/yourusername/this-template/issues)
- [Discussions](https://github.com/yourusername/this-template/discussions)
- [Documentation](./SETUP.md)

---

Built with ❤️ using modern web technologies