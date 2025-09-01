#!/bin/bash

# Fly.io Setup Script
# This script helps you set up and deploy your application to Fly.io

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

print_color "$BLUE" "
╔══════════════════════════════════════════════════════════╗
║                 Fly.io Setup Assistant                   ║
╚══════════════════════════════════════════════════════════╝
"

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    print_color "$RED" "Error: Fly CLI is not installed!"
    print_color "$YELLOW" "Please install it first: https://fly.io/docs/flyctl/install/"
    exit 1
fi

# Check if user is logged in
if ! fly auth whoami &> /dev/null; then
    print_color "$YELLOW" "You need to log in to Fly.io first."
    fly auth login
fi

# Get app names from fly.toml files or prompt user
if [ -f "fly.client.toml" ]; then
    CLIENT_APP=$(grep "^app = " fly.client.toml | cut -d'"' -f2)
fi

if [ -f "fly.server.toml" ]; then
    SERVER_APP=$(grep "^app = " fly.server.toml | cut -d'"' -f2)
fi

if [[ "$CLIENT_APP" == "YOUR-APP-NAME-client" ]] || [[ -z "$CLIENT_APP" ]]; then
    print_color "$GREEN" "\n📝 Enter your Fly.io app name prefix:"
    read -p "> " APP_PREFIX
    CLIENT_APP="${APP_PREFIX}-client"
    SERVER_APP="${APP_PREFIX}-server"
    
    # Update fly.toml files
    sed -i.bak "s/YOUR-APP-NAME-client/$CLIENT_APP/" fly.client.toml
    sed -i.bak "s/YOUR-APP-NAME-server/$SERVER_APP/" fly.server.toml
    rm fly.client.toml.bak fly.server.toml.bak
fi

print_color "$BLUE" "\n🚀 Setting up Fly.io apps:"
print_color "$YELLOW" "  • Client: $CLIENT_APP"
print_color "$YELLOW" "  • Server: $SERVER_APP"

# Create Fly apps
print_color "$GREEN" "\n📱 Creating Fly.io applications..."

# Check if apps already exist
if fly apps list | grep -q "$CLIENT_APP"; then
    print_color "$YELLOW" "  ✓ Client app already exists: $CLIENT_APP"
else
    print_color "$YELLOW" "  ↳ Creating client app: $CLIENT_APP"
    fly apps create "$CLIENT_APP" || true
fi

if fly apps list | grep -q "$SERVER_APP"; then
    print_color "$YELLOW" "  ✓ Server app already exists: $SERVER_APP"
else
    print_color "$YELLOW" "  ↳ Creating server app: $SERVER_APP"
    fly apps create "$SERVER_APP" || true
fi

# Database setup
print_color "$GREEN" "\n🗄️  Database Setup"
print_color "$YELLOW" "Choose your database option:"
echo "  1) Create new Fly Postgres database (recommended for production)"
echo "  2) Use external database (Neon, Supabase, etc.)"
echo "  3) Skip database setup"
read -p "> " DB_CHOICE

if [ "$DB_CHOICE" = "1" ]; then
    print_color "$YELLOW" "  ↳ Creating Fly Postgres database..."
    fly postgres create --name "${SERVER_APP}-db" --region sea --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 1 || true
    
    print_color "$YELLOW" "  ↳ Attaching database to server app..."
    fly postgres attach "${SERVER_APP}-db" --app "$SERVER_APP" || true
    
    print_color "$GREEN" "  ✓ Database created and attached!"
    print_color "$YELLOW" "  Note: DATABASE_URL secret has been automatically set"
    
elif [ "$DB_CHOICE" = "2" ]; then
    print_color "$GREEN" "\n📝 Enter your database connection URL:"
    read -p "> " DATABASE_URL
    
    print_color "$YELLOW" "  ↳ Setting DATABASE_URL secret..."
    fly secrets set DATABASE_URL="$DATABASE_URL" --app "$SERVER_APP"
fi

# Redis setup
print_color "$GREEN" "\n🔴 Redis Setup"
print_color "$YELLOW" "Choose your Redis option:"
echo "  1) Use Upstash Redis (recommended)"
echo "  2) Use external Redis"
echo "  3) Skip Redis setup"
read -p "> " REDIS_CHOICE

if [ "$REDIS_CHOICE" = "1" ]; then
    print_color "$YELLOW" "\nPlease create an Upstash Redis instance:"
    print_color "$BLUE" "  1. Go to: https://console.upstash.com"
    print_color "$BLUE" "  2. Create a new Redis database"
    print_color "$BLUE" "  3. Copy the Redis URL (with password)"
    print_color "$GREEN" "\n📝 Enter your Upstash Redis URL:"
    read -p "> " REDIS_URL
    
    fly secrets set REDIS_URL="$REDIS_URL" --app "$SERVER_APP"
    
elif [ "$REDIS_CHOICE" = "2" ]; then
    print_color "$GREEN" "\n📝 Enter your Redis URL:"
    read -p "> " REDIS_URL
    
    fly secrets set REDIS_URL="$REDIS_URL" --app "$SERVER_APP"
fi

# Set other required secrets
print_color "$GREEN" "\n🔐 Setting up authentication secrets..."

# Generate auth secret if not provided
print_color "$YELLOW" "  ↳ Generating authentication secret..."
AUTH_SECRET=$(openssl rand -base64 32)
fly secrets set BETTER_AUTH_SECRET="$AUTH_SECRET" --app "$SERVER_APP"

# Set auth URL
AUTH_URL="https://${SERVER_APP}.fly.dev"
fly secrets set BETTER_AUTH_URL="$AUTH_URL" --app "$SERVER_APP"

print_color "$GREEN" "  ✓ Secrets configured!"

# List all secrets (without values)
print_color "$BLUE" "\n📋 Configured secrets for $SERVER_APP:"
fly secrets list --app "$SERVER_APP"

# Update client configuration
print_color "$GREEN" "\n🔧 Updating client configuration..."
if [ -f "apps/client/.env" ]; then
    echo "" >> apps/client/.env
    echo "# Production API URL" >> apps/client/.env
    echo "VITE_API_URL=https://${SERVER_APP}.fly.dev" >> apps/client/.env
    print_color "$GREEN" "  ✓ Updated apps/client/.env with production API URL"
fi

# Deployment instructions
print_color "$GREEN" "\n✅ Fly.io setup complete!"
print_color "$BLUE" "\n📋 Next Steps:"
echo "
1. Review your Fly.io configuration:
   - fly.client.toml
   - fly.server.toml

2. Build your application:
   bun run build

3. Deploy to Fly.io:
   bun run deploy

   Or deploy individually:
   - Client: fly deploy --config fly.client.toml
   - Server: fly deploy --config fly.server.toml

4. Open your deployed apps:
   - Client: fly open --app $CLIENT_APP
   - Server: fly open --app $SERVER_APP

5. Monitor your apps:
   - Logs: fly logs --app $SERVER_APP
   - Status: fly status --app $SERVER_APP
"

print_color "$YELLOW" "\n⚠️  Important Notes:"
echo "
- First deployment may take a few minutes
- Server must be deployed before client can connect
- Check logs if deployment fails: fly logs --app <app-name>
- Scale resources as needed: fly scale --app <app-name>
"

print_color "$GREEN" "\n🎉 Happy deploying!"