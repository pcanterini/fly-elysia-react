# Custom Domain and Authentication Cookie Setup Guide

This guide provides complete instructions for setting up custom domains with working authentication cookies for a Fly.io deployment. It documents all changes needed from the template's base state to achieve a working authentication system with custom domains.

## Overview

This setup enables:
- Custom domain for client app (e.g., `yourdomain.com`)
- Subdomain for server API (e.g., `api.yourdomain.com` or `hono.yourdomain.com`)
- Cross-subdomain cookie authentication
- Proper CORS configuration
- Prevention of duplicate Fly.io machines

## Prerequisites

- Fly.io CLI installed and authenticated
- Custom domain with DNS management access
- Deployed Fly.io apps (client and server)

## Step 1: Fix Fly.io Machine Duplication Issue

The template has an issue where Fly.io creates duplicate machines for each process group. This must be fixed first.

### 1.1 Update `fly.server.toml`

Replace the entire services configuration section to use the newer `[http_service]` format:

**File:** `fly.server.toml`

```toml
# fly.toml app configuration file for server
#
# See https://fly.io/docs/reference/configuration/ for information about how to use this file.
#

app = "YOUR-APP-NAME-server"
primary_region = 'sea'

[build]
  dockerfile = "apps/server/Dockerfile"

[env]
  NODE_ENV = "production"

# Define multiple processes
[processes]
  web = "bun run start"
  worker = "bun run worker"

# HTTP service configuration for web process only
[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0
  processes = ["web"]  # Only web process handles HTTP

  [http_service.concurrency]
    type = "requests"
    hard_limit = 25
    soft_limit = 20

  [[http_service.checks]]
    interval = "15s"
    timeout = "2s"
    grace_period = "5s"
    method = "get"
    path = "/api/health"

# VM configuration applies to all processes
[[vm]]
  memory = '256mb'
  cpu_kind = 'shared'
  cpus = 1

[deploy]
  strategy = "immediate"

[experimental]
  auto_rollback = false
```

### 1.2 Update `deploy.sh`

Add machine scaling commands after deployment to ensure exactly 1 machine per process:

**File:** `deploy.sh`

Find the server deployment section (around line 70) and update it:

```bash
# Deploy to Fly.io
if [ "$DEPLOY_SERVER" = true ]; then
    echo ""
    print_color "$CYAN" "Deploying server to Fly.io..."
    if fly deploy --config fly.server.toml --ha=false; then
        echo -e "${GREEN}✓ Server deployed successfully${NC}"
        
        # Scale to ensure exactly 1 machine per process
        SERVER_APP=$(grep "^app = " fly.server.toml | sed "s/app = //g" | tr -d "'\"")
        print_color "$CYAN" "  ↳ Setting correct machine scaling..."
        fly scale count web=1 worker=1 --app "$SERVER_APP" --yes
        echo -e "${GREEN}  ✓ Scaled to 1 web + 1 worker machine${NC}"
        
        # Run database migrations
        print_color "$CYAN" "\nRunning database migrations..."
        
        # SSH into the server and run migrations
        echo -e "${DIM}  ↳ Applying database schema...${NC}"
        if fly ssh console --app "$SERVER_APP" -C "cd /app/apps/server && bun run db:push" 2>/dev/null; then
            echo -e "${GREEN}  ✓ Database migrations completed${NC}"
        else
            echo -e "${YELLOW}  ⚠ Could not run migrations automatically${NC}"
            echo -e "${DIM}  Run manually with: fly ssh console --app $SERVER_APP -C 'cd /app/apps/server && bun run db:push'${NC}"
        fi
    else
        echo -e "${RED}✗ Server deployment failed${NC}"
        exit 1
    fi
fi
```

### 1.3 Create Machine Scaling Script

Create a new utility script to fix machine scaling if needed:

**File:** `scripts/fly-scale.sh`

```bash
#!/bin/bash

# Script to ensure correct machine scaling after deployment
# This prevents Fly.io from creating duplicate machines

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_color() {
    echo -e "${1}${2}${NC}"
}

# Get app names from config files
SERVER_APP=$(grep "^app = " fly.server.toml | sed "s/app = //g" | tr -d "'\"")
CLIENT_APP=$(grep "^app = " fly.client.toml | sed "s/app = //g" | tr -d "'\"")

print_color "$BLUE" "
╔══════════════════════════════════════════════════════════╗
║            Setting Correct Machine Scaling               ║
╚══════════════════════════════════════════════════════════╝
"

# Scale server app - exactly 1 machine per process group
print_color "$CYAN" "Scaling server app: $SERVER_APP"
fly scale count web=1 worker=1 --app "$SERVER_APP" --yes

# Scale client app - exactly 1 machine
print_color "$CYAN" "Scaling client app: $CLIENT_APP"
fly scale count 1 --app "$CLIENT_APP" --yes

# Show current machine status
print_color "$GREEN" "\n✓ Scaling complete! Current machine status:"
echo ""
print_color "$YELLOW" "Server machines ($SERVER_APP):"
fly machines list --app "$SERVER_APP"

echo ""
print_color "$YELLOW" "Client machines ($CLIENT_APP):"
fly machines list --app "$CLIENT_APP"

print_color "$GREEN" "\n✓ Done! You should now have exactly:"
echo "  • 1 web machine (server)"
echo "  • 1 worker machine (server)"
echo "  • 1 client machine"
```

Make the script executable:
```bash
chmod +x scripts/fly-scale.sh
```

## Step 2: Configure DNS for Custom Domains

### 2.1 Add DNS Records

At your domain registrar/DNS provider, add the following records:

For the main domain (e.g., `yourdomain.com`):
- Type: A
- Name: @ (or leave blank)
- Value: (Will be provided by Fly.io after running cert command)

For the API subdomain (e.g., `api.yourdomain.com`):
- Type: CNAME
- Name: api (or your chosen subdomain)
- Value: `your-app-name-server.fly.dev`

### 2.2 Add SSL Certificates

Run these commands to add SSL certificates for your domains:

```bash
# For client app (main domain)
fly certs add yourdomain.com --app YOUR-APP-NAME-client

# For server app (subdomain)
fly certs add api.yourdomain.com --app YOUR-APP-NAME-server
```

After running the client cert command, Fly.io will provide IPv4 and IPv6 addresses. Update your DNS A/AAAA records with these values.

## Step 3: Set Environment Variables

### 3.1 Required Environment Variables

Set these environment variables on your Fly.io server app:

```bash
fly secrets set \
  BETTER_AUTH_URL=https://api.yourdomain.com \
  CLIENT_URL=https://yourdomain.com \
  COOKIE_DOMAIN=.yourdomain.com \
  NODE_ENV=production \
  --app YOUR-APP-NAME-server
```

**Important:** The `COOKIE_DOMAIN` must start with a dot (`.yourdomain.com`) to enable cross-subdomain cookie sharing.

### 3.2 Verify Environment Variables

Check that all variables are set correctly:

```bash
fly ssh console --app YOUR-APP-NAME-server -C "env" | grep -E 'BETTER_AUTH_URL|CLIENT_URL|COOKIE_DOMAIN|NODE_ENV'
```

## Step 4: Update Authentication Configuration

The authentication configuration in the template needs to be updated to properly handle custom domains.

### 4.1 Fix Cookie Domain Configuration

**File:** `apps/server/src/auth/config.ts`

The current template has a hardcoded fallback to `.fly.dev` which prevents custom domains from working. Update line 19:

**Before:**
```typescript
const cookieDomain = process.env.COOKIE_DOMAIN || (isProduction ? '.fly.dev' : undefined);
```

**After:**
```typescript
const cookieDomain = process.env.COOKIE_DOMAIN || undefined;
```

Also update lines 55 and 67 to remove the `.fly.dev` fallback:

**Line 55 - Before:**
```typescript
domain: cookieDomain || '.fly.dev', // Always set domain in production for Fly.io
```

**Line 55 - After:**
```typescript
domain: cookieDomain, // Use environment variable
```

**Line 67 - Before:**
```typescript
domain: cookieDomain || '.fly.dev' // Must specify domain here for cross-subdomain to work
```

**Line 67 - After:**
```typescript
domain: cookieDomain // Use environment variable
```

### 4.2 Ensure Proper CORS Configuration

The server's CORS configuration should already handle custom domains dynamically through environment variables. Verify that `apps/server/src/index.ts` includes:

```typescript
const allowedOrigins = [
  // In production, use CLIENT_URL env var or derive from BETTER_AUTH_URL
  ...(isProduction && process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
  ...(isProduction && !process.env.CLIENT_URL && process.env.BETTER_AUTH_URL ? [
    // Derive client URL from server URL (replace -server with -client)
    process.env.BETTER_AUTH_URL.replace('-server', '-client')
  ] : []),
  // Development origins...
]
```

## Step 5: Update Client Configuration

### 5.1 Update API Base URL Detection

**File:** `apps/client/src/lib/api.ts`

For custom domains, you have two options:

**Option 1: Use Build-Time Environment Variable**

Set `VITE_API_URL` during deployment:

```bash
fly deploy --config fly.client.toml \
  --build-arg VITE_API_URL="https://api.yourdomain.com" \
  --app YOUR-APP-NAME-client
```

**Option 2: Update Runtime Detection Logic**

Modify the `getApiBaseUrl` function (around line 18-35) to handle your custom domain pattern:

```typescript
const getApiBaseUrl = () => {
  // Check if we have an explicit environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production, detect based on hostname
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // For custom domains, prepend 'api.' to the domain
    const hostname = window.location.hostname;
    
    // Handle both www and non-www domains
    if (hostname.startsWith('www.')) {
      return `https://api.${hostname.slice(4)}`;
    }
    
    // For main domain, use api subdomain
    return `https://api.${hostname}`;
  }
  
  // Default to localhost for development
  return 'http://localhost:3001';
};
```

## Step 6: Deploy with Custom Domains

### 6.1 Deploy Server

```bash
fly deploy --config fly.server.toml --ha=false --app YOUR-APP-NAME-server
```

### 6.2 Deploy Client

With explicit API URL:

```bash
fly deploy --config fly.client.toml \
  --build-arg VITE_API_URL="https://api.yourdomain.com" \
  --app YOUR-APP-NAME-client
```

### 6.3 Verify Machine Scaling

After deployment, verify you have the correct number of machines:

```bash
./scripts/fly-scale.sh
```

## Step 7: Verification

### 7.1 Check DNS Resolution

```bash
# Check that domains resolve
nslookup yourdomain.com
nslookup api.yourdomain.com
```

### 7.2 Check SSL Certificates

```bash
fly certs show yourdomain.com --app YOUR-APP-NAME-client
fly certs show api.yourdomain.com --app YOUR-APP-NAME-server
```

### 7.3 Test Authentication

1. Open your browser and navigate to `https://yourdomain.com`
2. Open Developer Tools → Application → Cookies
3. Sign up or sign in
4. Verify that cookies are set with:
   - Domain: `.yourdomain.com`
   - Secure: true
   - HttpOnly: true
   - SameSite: None

### 7.4 Test Cross-Subdomain Cookie Access

The authentication cookie should be accessible from both:
- `https://yourdomain.com`
- `https://api.yourdomain.com`

## Troubleshooting

### Issue: Cookies still showing wrong domain

**Solution:** Ensure `COOKIE_DOMAIN` environment variable is set correctly:

```bash
fly secrets set COOKIE_DOMAIN=.yourdomain.com --app YOUR-APP-NAME-server
```

Then restart the app:

```bash
fly apps restart YOUR-APP-NAME-server
```

### Issue: CORS errors when making API requests

**Solution:** Verify `CLIENT_URL` environment variable matches your client domain:

```bash
fly secrets set CLIENT_URL=https://yourdomain.com --app YOUR-APP-NAME-server
```

### Issue: Multiple machines created for each process

**Solution:** Run the scaling script after deployment:

```bash
./scripts/fly-scale.sh
```

### Issue: Authentication not persisting

**Solution:** Check that cookies have correct attributes:
1. Domain must be `.yourdomain.com` (with leading dot)
2. Secure must be `true` for HTTPS
3. SameSite must be `None` for cross-origin requests

## Summary of Required Changes from Template

1. **Environment Variables (Required)**
   - `BETTER_AUTH_URL`: Full URL of your API (e.g., `https://api.yourdomain.com`)
   - `CLIENT_URL`: Full URL of your client (e.g., `https://yourdomain.com`)
   - `COOKIE_DOMAIN`: Domain for cookies (e.g., `.yourdomain.com`)

2. **Code Changes**
   - `apps/server/src/auth/config.ts`: Remove hardcoded `.fly.dev` fallbacks (lines 19, 55, 67)
   - `apps/client/src/lib/api.ts`: Update API URL detection for custom domains (optional if using VITE_API_URL)

3. **Configuration Changes**
   - `fly.server.toml`: Use `[http_service]` instead of `[[services]]` format
   - `deploy.sh`: Add `--ha=false` flag and scaling commands

4. **New Files**
   - `scripts/fly-scale.sh`: Utility script to fix machine scaling

## Next Steps for Template Repository

To update your template repository with these fixes:

1. Apply all code changes mentioned above
2. Update the README to document the environment variables needed
3. Consider adding environment variable validation on startup
4. Add this guide to the template documentation
5. Test deployment with a fresh project to ensure everything works

This configuration will ensure that authentication works properly across custom domains with correct cookie handling and no duplicate machines.