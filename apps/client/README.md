# Client Application

React frontend built with Vite and TypeScript.

## Architecture

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **State Management**: TanStack Query for server state, nuqs for URL state
- **Styling**: terminal.css for retro terminal aesthetics
- **Routing**: React Router v7
- **Icons**: react-icons library

## Project Structure

```
src/
├── assets/       # Static assets (images, fonts)
├── contexts/     # React contexts (Auth, Theme)
├── hooks/        # Custom React hooks
├── lib/          # Utilities and API client
├── pages/        # Page components
├── styles/       # Global styles
├── tests/        # Test files
├── types/        # TypeScript type definitions
├── App.tsx       # Main app component with routing
└── main.tsx      # Application entry point
```

## Key Files

- `lib/api.ts` - Centralized API client with typed methods
- `contexts/AuthContext.tsx` - Authentication state management
- `hooks/useAuth.ts` - Authentication hook
- `pages/` - All page components (Home, Dashboard, Login, etc.)

## Development

```bash
# Run development server
bun run dev

# Build for production
bun run build

# Run linter
bun run lint

# Preview production build
bun run preview

# Run tests
bun run test
```

## Environment Variables

Create `.env` file (optional - defaults are in code):

```env
# API URL (auto-detected if not set)
VITE_API_URL=http://localhost:3001

# App configuration
VITE_APP_NAME=My App
VITE_APP_VERSION=1.0.0
```

## API Integration

The client uses a typed API client (`lib/api.ts`) that:
- Auto-detects API URL based on environment
- Handles authentication cookies
- Provides typed methods for all endpoints
- Integrates with TanStack Query

## Authentication

Uses Better-Auth with:
- Session-based authentication
- Secure cookie handling
- Protected routes
- Auto-refresh on mount

## Styling

Uses terminal.css for a retro terminal look. Custom styles in:
- `src/index.css` - Global styles
- `src/App.css` - App-specific styles
- Component-specific CSS modules

## Building for Production

```bash
# Build the application
bun run build

# Output will be in dist/
# Serve with any static file server
```

## Docker

```bash
# Development with hot reload
docker build -f Dockerfile.dev -t client-dev .
docker run -p 5173:5173 -v $(pwd)/src:/app/src client-dev

# Production build
docker build -f Dockerfile -t client-prod .
docker run -p 80:80 client-prod
```

## Testing

```bash
# Run unit tests
bun run test

# Run with UI
bun run test:ui

# Coverage report
bun run test:coverage
```

## Deployment

The client is configured for deployment to:
- Fly.io (via fly.client.toml)
- Any static hosting service
- Docker containers

## Performance

- Code splitting with React.lazy
- Optimized bundle with Vite
- Image optimization
- Caching strategies in place