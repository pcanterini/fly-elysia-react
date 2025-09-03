#!/bin/bash

# Full Stack Deployment Script
# Deploys both client and server to Fly.io

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

print_color "$BLUE" "
╔══════════════════════════════════════════════════════════╗
║              Deploying Full Stack to Fly.io              ║
╚══════════════════════════════════════════════════════════╝
"

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    print_color "$RED" "Error: Fly CLI is not installed!"
    print_color "$YELLOW" "Install it from: https://fly.io/docs/flyctl/install/"
    exit 1
fi

# Parse arguments
DEPLOY_CLIENT=true
DEPLOY_SERVER=true

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --client-only) DEPLOY_SERVER=false ;;
        --server-only) DEPLOY_CLIENT=false ;;
        -h|--help) 
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --client-only    Deploy only the client"
            echo "  --server-only    Deploy only the server"
            echo "  -h, --help       Show this help message"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

# Build the applications
print_color "$CYAN" "Building applications..."

if [ "$DEPLOY_CLIENT" = true ]; then
    print_color "$BLUE" "  ↳ Building client..."
    cd apps/client && bun run build && cd ../..
fi

if [ "$DEPLOY_SERVER" = true ]; then
    print_color "$BLUE" "  ↳ Building server..."
    cd apps/server && bun run build && cd ../..
fi

echo -e "${GREEN}✓ Build complete${NC}"

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

if [ "$DEPLOY_CLIENT" = true ]; then
    echo ""
    print_color "$CYAN" "Deploying client to Fly.io..."
    
    # Deploy client without build args - it will detect API URL dynamically
    if fly deploy --config fly.client.toml; then
        echo -e "${GREEN}✓ Client deployed successfully${NC}"
        echo -e "${DIM}  Client will auto-detect API URL based on hostname${NC}"
    else
        echo -e "${RED}✗ Client deployment failed${NC}"
        exit 1
    fi
fi

# Print success message
echo ""
echo -e "${GREEN}◆ Deployment complete!${NC}"

# Show app URLs
if [ "$DEPLOY_CLIENT" = true ]; then
    CLIENT_URL=$(fly status --config fly.client.toml --json | grep -o '"Hostname":"[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$CLIENT_URL" ]; then
        echo ""
        echo -e "${CYAN}Client URL:${NC} https://$CLIENT_URL"
    fi
fi

if [ "$DEPLOY_SERVER" = true ]; then
    SERVER_URL=$(fly status --config fly.server.toml --json | grep -o '"Hostname":"[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$SERVER_URL" ]; then
        echo -e "${CYAN}Server URL:${NC} https://$SERVER_URL"
    fi
fi

# Check if custom domain is configured and remind about DNS
if [ "$DEPLOY_CLIENT" = true ] || [ "$DEPLOY_SERVER" = true ]; then
    # Get app names
    CLIENT_APP=$(grep "^app = " fly.client.toml | sed "s/app = //g" | tr -d "'\"")
    
    # Check if custom domain exists
    if fly certs list --app "$CLIENT_APP" 2>/dev/null | grep -v "Host Name" | grep -q "."; then
        echo ""
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}Custom domain detected!${NC}"
        echo -e "${DIM}To verify your DNS records are using the correct IPs:${NC}"
        echo -e "${CYAN}  ./scripts/get-dns-records.sh${NC}"
        echo ""
        echo -e "${DIM}Remember: BOTH IPv4 (A) and IPv6 (AAAA) records are REQUIRED${NC}"
        echo -e "${DIM}for SSL certificates to work properly.${NC}"
        echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    fi
fi

echo ""
echo -e "${DIM}View logs:${NC}"
if [ "$DEPLOY_CLIENT" = true ]; then
    echo "  Client: fly logs --config fly.client.toml"
fi
if [ "$DEPLOY_SERVER" = true ]; then
    echo "  Server: fly logs --config fly.server.toml"
fi

echo ""
echo -e "${DIM}View status:${NC}"
if [ "$DEPLOY_CLIENT" = true ]; then
    echo "  Client: fly status --config fly.client.toml"
fi
if [ "$DEPLOY_SERVER" = true ]; then
    echo "  Server: fly status --config fly.server.toml"
fi