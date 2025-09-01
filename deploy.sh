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
print_color "$YELLOW" "🔨 Building applications..."

if [ "$DEPLOY_CLIENT" = true ]; then
    print_color "$BLUE" "  ↳ Building client..."
    cd apps/client && bun run build && cd ../..
fi

if [ "$DEPLOY_SERVER" = true ]; then
    print_color "$BLUE" "  ↳ Building server..."
    cd apps/server && bun run build && cd ../..
fi

print_color "$GREEN" "✅ Build complete!"

# Deploy to Fly.io
if [ "$DEPLOY_SERVER" = true ]; then
    print_color "$YELLOW" "\n🚀 Deploying server to Fly.io..."
    if fly deploy --config fly.server.toml; then
        print_color "$GREEN" "✅ Server deployed successfully!"
    else
        print_color "$RED" "❌ Server deployment failed!"
        exit 1
    fi
fi

if [ "$DEPLOY_CLIENT" = true ]; then
    print_color "$YELLOW" "\n🚀 Deploying client to Fly.io..."
    if fly deploy --config fly.client.toml; then
        print_color "$GREEN" "✅ Client deployed successfully!"
    else
        print_color "$RED" "❌ Client deployment failed!"
        exit 1
    fi
fi

# Print success message
print_color "$GREEN" "\n🎉 Deployment complete!"

# Show app URLs
if [ "$DEPLOY_CLIENT" = true ]; then
    CLIENT_URL=$(fly status --config fly.client.toml --json | grep -o '"Hostname":"[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$CLIENT_URL" ]; then
        print_color "$BLUE" "\n📱 Client URL: https://$CLIENT_URL"
    fi
fi

if [ "$DEPLOY_SERVER" = true ]; then
    SERVER_URL=$(fly status --config fly.server.toml --json | grep -o '"Hostname":"[^"]*' | head -1 | cut -d'"' -f4)
    if [ ! -z "$SERVER_URL" ]; then
        print_color "$BLUE" "🔧 Server URL: https://$SERVER_URL"
    fi
fi

print_color "$YELLOW" "\n📊 View logs:"
if [ "$DEPLOY_CLIENT" = true ]; then
    echo "  Client: fly logs --config fly.client.toml"
fi
if [ "$DEPLOY_SERVER" = true ]; then
    echo "  Server: fly logs --config fly.server.toml"
fi

print_color "$YELLOW" "\n📈 View status:"
if [ "$DEPLOY_CLIENT" = true ]; then
    echo "  Client: fly status --config fly.client.toml"
fi
if [ "$DEPLOY_SERVER" = true ]; then
    echo "  Server: fly status --config fly.server.toml"
fi