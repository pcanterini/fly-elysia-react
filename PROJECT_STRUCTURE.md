# Project Structure

## Directory Layout

```
.
├── apps/                         # Application packages
│   ├── client/                   # React frontend application
│   │   ├── public/              # Static assets
│   │   ├── src/                 # Source code
│   │   │   ├── assets/          # Images, fonts, etc.
│   │   │   ├── contexts/        # React contexts
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── lib/             # Utilities and API client
│   │   │   ├── pages/           # Page components
│   │   │   ├── styles/          # Global styles
│   │   │   ├── tests/           # Test files
│   │   │   ├── types/           # TypeScript types
│   │   │   ├── App.tsx          # Main app component
│   │   │   ├── main.tsx         # Application entry point
│   │   │   └── vite-env.d.ts    # Vite type definitions
│   │   ├── Dockerfile           # Production container
│   │   ├── Dockerfile.dev       # Development container
│   │   ├── package.json         # Dependencies and scripts
│   │   ├── tsconfig.json        # TypeScript configuration
│   │   └── vite.config.ts       # Vite configuration
│   │
│   └── server/                   # Elysia backend application
│       ├── src/                 # Source code
│       │   ├── auth/            # Authentication setup
│       │   ├── db/              # Database schema and config
│       │   ├── middleware/      # Express/Elysia middleware
│       │   ├── queue/           # Job queue system
│       │   ├── routes/          # API route handlers
│       │   ├── types/           # TypeScript types
│       │   ├── utils/           # Utility functions
│       │   ├── index.ts         # Server entry point
│       │   └── worker.ts        # Background worker process
│       ├── drizzle/             # Database migrations
│       ├── Dockerfile           # Production container
│       ├── Dockerfile.dev       # Development container
│       ├── drizzle.config.ts    # Drizzle ORM configuration
│       ├── package.json         # Dependencies and scripts
│       └── tsconfig.json        # TypeScript configuration
│
├── packages/                     # Shared packages
│   └── shared/                  # Shared types and constants
│       ├── src/
│       │   ├── constants.ts    # Shared constants
│       │   ├── types.ts        # Shared TypeScript types
│       │   └── index.ts        # Package exports
│       ├── package.json
│       └── tsconfig.json
│
├── scripts/                      # Automation scripts
│   ├── init.sh                  # Project initialization
│   ├── setup-fly.sh             # Fly.io setup automation
│   ├── dev-clean.sh             # Clean development environment
│   └── check-processes.sh       # Check running processes
│
├── docs/                        # Documentation
│   ├── DOCKER.md               # Docker guide
│   ├── COOKIE_FIX.md           # Cookie configuration guide
│   ├── PERFORMANCE_OVERVIEW.md # Performance documentation
│   ├── SCALING_GUIDE.md        # Scaling strategies
│   └── archive/                # Archived documentation
│
├── .github/                     # GitHub configuration
│   ├── ISSUE_TEMPLATE/         # Issue templates
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── pull_request_template.md
│
├── Configuration Files
├── .env.example                 # Environment variables template
├── .gitignore                  # Git ignore rules
├── docker-compose.yml          # Development Docker setup
├── docker-compose.prod.yml     # Production Docker setup
├── fly.client.toml             # Fly.io client config
├── fly.server.toml             # Fly.io server config
├── package.json                # Root package.json
├── bun.lockb                   # Bun lock file
├── tsconfig.json               # Root TypeScript config
│
└── Documentation
    ├── README.md               # Project overview
    ├── SETUP.md               # Setup instructions
    ├── CONTRIBUTING.md        # Contribution guidelines
    ├── CLAUDE.md              # AI assistant instructions
    ├── LICENSE                # License file
    └── PROJECT_STRUCTURE.md  # This file
```

## Key Directories

### `/apps/client`
The React frontend application built with Vite. Contains all UI components, routing, and client-side logic.

### `/apps/server`
The Elysia backend API server running on Bun. Handles authentication, database operations, and business logic.

### `/packages/shared`
Shared TypeScript types and constants used by both client and server to ensure type safety across the stack.

### `/scripts`
Utility scripts for development and deployment automation.

### `/docs`
Technical documentation including guides for Docker, scaling, and performance optimization.

## Configuration Files

### Root Level
- **package.json** - Workspace configuration and shared scripts
- **tsconfig.json** - Base TypeScript configuration
- **docker-compose.yml** - Local development with hot reload
- **docker-compose.prod.yml** - Production-like environment

### Deployment
- **fly.client.toml** - Fly.io configuration for frontend
- **fly.server.toml** - Fly.io configuration for backend
- **deploy.sh** - Deployment automation script

### Development
- **.env.example** - Template for environment variables
- **.gitignore** - Version control exclusions
- **bun.lockb** - Dependency lock file

## Monorepo Structure

This project uses Bun workspaces for monorepo management:

- Shared dependencies are hoisted to root
- Each app has its own dependencies and scripts
- The `@my-app/shared` package is available to all apps
- Scripts can be run from root or individual packages

## File Naming Conventions

- **Components**: PascalCase (e.g., `HomePage.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types**: PascalCase with `.types.ts` extension
- **Tests**: Same name with `.test.ts` extension
- **Styles**: Same name with `.css` extension

## Import Aliases

### Client (`@/`)
```typescript
import { apiClient } from '@/lib/api'
import { Button } from '@/components/Button'
```

### Shared Package
```typescript
import { UserType } from '@my-app/shared'
```

## Environment Files

### Development
- `apps/server/.env` - Server environment variables
- `apps/client/.env` - Client environment variables (optional)

### Production
- Environment variables set via Fly.io secrets
- Docker environment variables in compose files

## Build Outputs

- **Client**: `apps/client/dist/` - Static files for production
- **Server**: `apps/server/dist/` - Compiled JavaScript files
- **Docker**: Images tagged with app names

## Scripts Organization

### Root Scripts
- Development, building, testing, deployment
- Docker operations
- Workspace-wide operations

### App-Specific Scripts
- Located in respective `package.json` files
- Can be run from root with workspace prefix
- Include dev, build, test, lint commands