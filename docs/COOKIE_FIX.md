# Authentication Cookie Configuration Guide

## Overview

This guide explains how the authentication system works in this template and how to configure it for both Fly.io deployments and custom domains.

## How Authentication Works

The template uses better-auth for authentication with cookie-based sessions. The key components are:

1. **Server Configuration** (`apps/server/src/auth/config.ts`): Handles cookie settings and session management
2. **Client Configuration** (`apps/client/src/lib/auth.ts`): Manages authentication on the frontend
3. **Dynamic API Detection** (`apps/client/src/lib/api.ts`): Automatically determines the API URL based on hostname

## Default Configuration (Works Out of the Box)

The template is pre-configured to work correctly with:
- Local development (localhost)
- Fly.io deployments (*.fly.dev domains)
- Custom domains (with proper environment variables)

### Key Features:
- **No build-time API URL needed**: The client automatically detects the API URL at runtime
- **Proper cookie configuration**: Sessions and cookies are properly configured in the auth setup
- **Cross-subdomain support**: Cookies work across subdomains when configured correctly

## Deployment Scenarios

### 1. Fly.io Default Domains

When deploying to Fly.io with default domains:
- Client: `your-app-client.fly.dev`
- Server: `your-app-server.fly.dev`

No additional configuration needed! The client will automatically detect and use the correct server URL.

```bash
# Deploy both apps
bun run deploy

# Or deploy individually
fly deploy --config fly.server.toml
fly deploy --config fly.client.toml
```

### 2. Custom Domains

For custom domains (e.g., `yourdomain.com` and `api.yourdomain.com`):

#### Step 1: Set Environment Variables on Server

```bash
fly secrets set \
  BETTER_AUTH_URL=https://api.yourdomain.com \
  CLIENT_URL=https://yourdomain.com \
  COOKIE_DOMAIN=.yourdomain.com \
  --app your-app-server
```

**Important**: The `COOKIE_DOMAIN` must start with a dot (`.`) to enable cross-subdomain cookie sharing.

#### Step 2: Configure DNS

Add these DNS records at your domain provider:

For the main domain:
- Type: A
- Name: @ (or blank)
- Value: 66.241.124.107 (Fly.io shared IP)

For the API subdomain:
- Type: CNAME
- Name: api
- Value: your-app-server.fly.dev

#### Step 3: Add SSL Certificates

```bash
fly certs add yourdomain.com --app your-app-client
fly certs add api.yourdomain.com --app your-app-server
```

#### Step 4: Deploy

```bash
bun run deploy
```

The client will automatically detect it's running on a custom domain and construct the API URL accordingly.

## How the Dynamic API Detection Works

The client uses smart detection logic in `apps/client/src/lib/api.ts`:

1. **Development**: Uses `http://localhost:3001`
2. **Fly.io domains**: Converts `*-client.fly.dev` to `*-server.fly.dev`
3. **Custom domains**: Prepends `api.` to the domain
4. **Environment override**: Respects `VITE_API_URL` if explicitly set

This means you don't need to rebuild the client with different API URLs for different environments!

## Cookie Configuration Details

The authentication system uses these cookie settings:

### Production:
- **Secure**: true (HTTPS only)
- **HttpOnly**: true (prevents XSS)
- **SameSite**: 'none' (allows cross-origin)
- **Domain**: Set via `COOKIE_DOMAIN` env var
- **Path**: '/' (available on all paths)

### Development:
- **Secure**: false (allows HTTP)
- **HttpOnly**: true
- **SameSite**: 'lax'
- **Domain**: Not set (uses current domain)

## Troubleshooting

### Issue: Authentication not persisting

**Check cookie settings in browser DevTools:**
1. Open Application → Cookies
2. Verify cookies are set with correct domain
3. For custom domains, domain should be `.yourdomain.com`

**Solution:**
```bash
fly secrets set COOKIE_DOMAIN=.yourdomain.com --app your-app-server
fly apps restart your-app-server
```

### Issue: CORS errors

**Solution:**
```bash
fly secrets set CLIENT_URL=https://yourdomain.com --app your-app-server
fly apps restart your-app-server
```

### Issue: Duplicate Fly.io machines

After deployment, if you see duplicate machines:

```bash
./scripts/fly-scale.sh
```

This ensures exactly 1 web machine, 1 worker machine for the server, and 1 machine for the client.

### Issue: Wrong certificate IPs shown during setup

The setup script now uses Fly.io's standard shared IPs:
- IPv4: 66.241.124.107
- IPv6: 2a09:8280:1::3:4a5d

These work for most Fly.io deployments. If you have dedicated IPs, update them in your DNS settings after running the setup.

## Security Considerations

1. **Always use HTTPS in production**: Cookies with `Secure=true` only work over HTTPS
2. **Set proper CORS origins**: The server automatically includes `CLIENT_URL` in trusted origins
3. **Use environment variables**: Never hardcode sensitive URLs or secrets
4. **Cookie domain scope**: Use the narrowest domain scope possible (e.g., `.yourdomain.com` not `.com`)

## Environment Variables Reference

### Required for Production:
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Random secret for authentication
- `BETTER_AUTH_URL`: Full URL of your API

### Required for Custom Domains:
- `CLIENT_URL`: Frontend URL (e.g., `https://yourdomain.com`)
- `COOKIE_DOMAIN`: Cookie domain with leading dot (e.g., `.yourdomain.com`)

### Optional:
- `REDIS_URL`: For job queue functionality
- `NODE_ENV`: Set to 'production' (automatically set by Fly.io)

## Summary

The template's authentication system is designed to work seamlessly across different deployment scenarios:

1. **Zero configuration needed for Fly.io deployments**
2. **Simple environment variables for custom domains**
3. **Automatic API URL detection eliminates build-time configuration**
4. **Proper cookie settings for cross-subdomain authentication**
5. **Built-in security best practices**

Just deploy and it works!