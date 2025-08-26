# Cross-Origin Cookie Configuration Fix

## The Problem
Authentication cookies were not persisting in production when the client (`bun-app-client.fly.dev`) and server (`bun-app-server.fly.dev`) were on different subdomains. The cookies were being set with `SameSite=Lax` which prevents cross-origin requests from including them.

## The Solution

### 1. Set NODE_ENV at Build Time
In `apps/server/Dockerfile`, we set `ENV NODE_ENV=production` before the build step. This is critical because Bun evaluates environment variables during bundling and hardcodes the values.

```dockerfile
# Set NODE_ENV for the build phase
# This is critical for Bun to evaluate production conditions at build time
ENV NODE_ENV=production

# Build the server
RUN cd apps/server && bun run build
```

### 2. Configure betterAuth Cookies Properly
In `apps/server/src/auth/config.ts`, we use the `advanced.cookies` API to configure cookie attributes:

```typescript
const isProduction = process.env.NODE_ENV === 'production';

export const auth = betterAuth({
  // ... other config
  advanced: {
    useSecureCookies: isProduction,
    cookies: {
      session_token: {
        name: "better-auth.session_token",
        attributes: {
          httpOnly: true,
          // Cross-origin cookies require SameSite=None and Secure=true
          sameSite: isProduction ? 'none' as const : 'lax' as const,
          secure: isProduction,
          path: '/',
        }
      }
    }
  }
});
```

### 3. Include Credentials in Client Requests
Ensure all fetch requests from the client include credentials:

```typescript
fetch(url, {
  credentials: 'include'
})
```

## Why This Works

1. **Build-time Evaluation**: Setting `NODE_ENV=production` in the Dockerfile ensures Bun evaluates `process.env.NODE_ENV === 'production'` to `true` during bundling, hardcoding the production settings.

2. **Cross-Origin Cookies**: For cookies to work across different origins:
   - `SameSite` must be set to `'none'` 
   - `Secure` must be `true`
   - The connection must use HTTPS

3. **betterAuth API**: The `advanced.cookies.session_token.attributes` is the correct way to configure cookie attributes in betterAuth.

## Local Development Setup

For local Docker development, we use a separate `Dockerfile.dev` that builds without setting `NODE_ENV`. This ensures the development configuration is used:

### Dockerfile.dev
```dockerfile
# Build the server without NODE_ENV set
# Bun will default to development mode when NODE_ENV is not set
RUN cd apps/server && bun run build
```

This results in:
- `isProduction = false`
- Cookies set with `SameSite=Lax` (works on localhost)
- `Secure=false` (allows HTTP in development)

## Testing

### Local Development
```bash
# Start the full stack locally
docker-compose up -d

# Test authentication from Docker client origin
curl -X POST http://localhost:3001/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Local Production Build
```bash
docker build -f apps/server/Dockerfile -t test-server .
docker run --rm test-server cat dist/index.js | grep "var isProduction3"
# Should output: var isProduction3 = true;
```

### Verify in Production
```bash
curl https://bun-app-server.fly.dev/api/health
# Should show NODE_ENV: "production"
```