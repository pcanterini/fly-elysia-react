#!/bin/bash

# Full-Stack Template Initialization Script
# This script helps you set up a new project from the template

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

print_color "$BLUE" "
╔══════════════════════════════════════════════════════════╗
║          Full-Stack Template Initialization              ║
║       React + Elysia + Bun + Fly.io Template            ║
╚══════════════════════════════════════════════════════════╝
"

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    print_color "$RED" "Error: Bun is not installed!"
    print_color "$YELLOW" "Please install Bun first: https://bun.sh"
    exit 1
fi

# Get project name
print_color "$GREEN" "\n📝 Enter your project name (lowercase, hyphens allowed):"
read -p "> " PROJECT_NAME

# Validate project name
if [[ ! "$PROJECT_NAME" =~ ^[a-z][a-z0-9-]*$ ]]; then
    print_color "$RED" "Invalid project name! Use lowercase letters, numbers, and hyphens only."
    exit 1
fi

print_color "$GREEN" "\n📝 Enter your project description:"
read -p "> " PROJECT_DESCRIPTION

# Get deployment preferences
print_color "$GREEN" "\n🚀 Will you deploy to Fly.io? (y/n):"
read -p "> " DEPLOY_FLY

FLY_APP_NAME=""
if [[ "$DEPLOY_FLY" == "y" || "$DEPLOY_FLY" == "Y" ]]; then
    print_color "$GREEN" "\n📝 Enter your Fly.io app name prefix (will create app-client and app-server):"
    read -p "> " FLY_APP_NAME
fi

# Database setup
print_color "$GREEN" "\n🗄️  Enter your PostgreSQL database name (default: ${PROJECT_NAME//-/_}_db):"
read -p "> " DB_NAME
DB_NAME=${DB_NAME:-${PROJECT_NAME//-/_}_db}

print_color "$BLUE" "\n🔧 Starting project initialization..."

# Update package.json files
print_color "$YELLOW" "  ↳ Updating package.json files..."

# Root package.json
if [ -f "package.json" ]; then
    sed -i.bak "s/\"name\": \"full-stack-template\"/\"name\": \"$PROJECT_NAME\"/" package.json
    rm package.json.bak
fi

# Update Fly.io configs if needed
if [[ "$DEPLOY_FLY" == "y" || "$DEPLOY_FLY" == "Y" ]]; then
    print_color "$YELLOW" "  ↳ Updating Fly.io configuration..."
    
    # Update client config
    if [ -f "fly.client.toml" ]; then
        sed -i.bak "s/YOUR-APP-NAME-client/${FLY_APP_NAME}-client/" fly.client.toml
        rm fly.client.toml.bak
    fi
    
    # Update server config
    if [ -f "fly.server.toml" ]; then
        sed -i.bak "s/YOUR-APP-NAME-server/${FLY_APP_NAME}-server/" fly.server.toml
        rm fly.server.toml.bak
    fi
fi

# Create .env files from examples
print_color "$YELLOW" "  ↳ Creating environment files..."

# Server .env
if [ -f "apps/server/.env.example" ]; then
    cp apps/server/.env.example apps/server/.env
    
    # Update database name
    sed -i.bak "s/your_database_name/$DB_NAME/" apps/server/.env
    
    # Generate auth secret (use hex to avoid special characters)
    AUTH_SECRET=$(openssl rand -hex 32)
    sed -i.bak "s/your-secret-key-min-32-chars-change-in-production/$AUTH_SECRET/" apps/server/.env
    
    # Update production URL if Fly.io is used
    if [[ "$DEPLOY_FLY" == "y" || "$DEPLOY_FLY" == "Y" ]]; then
        echo "" >> apps/server/.env
        echo "# Production URLs (update after first deployment)" >> apps/server/.env
        echo "# BETTER_AUTH_URL=https://${FLY_APP_NAME}-server.fly.dev" >> apps/server/.env
    fi
    
    rm apps/server/.env.bak
fi

# Client .env (optional)
if [ -f "apps/client/.env.example" ]; then
    cp apps/client/.env.example apps/client/.env
    
    # Update app name
    sed -i.bak "s/My App/$PROJECT_NAME/" apps/client/.env
    
    # Update API URL if Fly.io is used
    if [[ "$DEPLOY_FLY" == "y" || "$DEPLOY_FLY" == "Y" ]]; then
        echo "" >> apps/client/.env
        echo "# Production API URL (uncomment after deployment)" >> apps/client/.env
        echo "# VITE_API_URL=https://${FLY_APP_NAME}-server.fly.dev" >> apps/client/.env
    fi
    
    rm apps/client/.env.bak
fi

# Install dependencies
print_color "$YELLOW" "  ↳ Installing dependencies with Bun..."
bun install

# Initialize git repository
if [ ! -d ".git" ]; then
    print_color "$YELLOW" "  ↳ Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit from template"
fi

# Create initial database if Docker is available
if command -v docker &> /dev/null; then
    print_color "$GREEN" "\n🐳 Docker detected. Start PostgreSQL and Redis now? (y/n):"
    read -p "> " START_DB
    
    if [[ "$START_DB" == "y" || "$START_DB" == "Y" ]]; then
        print_color "$YELLOW" "  ↳ Starting PostgreSQL and Redis..."
        docker-compose up -d postgres redis
        
        # Wait for database to be ready
        print_color "$YELLOW" "  ↳ Waiting for database to be ready..."
        sleep 3
        
        # Create the database
        print_color "$YELLOW" "  ↳ Creating database if it doesn't exist..."
        ./scripts/create-database.sh "$DB_NAME" "postgres" "postgres"
        
        # Run migrations
        print_color "$YELLOW" "  ↳ Running database migrations..."
        cd apps/server && bun run db:push && cd ../..
    fi
fi

print_color "$GREEN" "\n✅ Project initialization complete!"

# Print next steps
print_color "$BLUE" "\n📋 Next Steps:"
echo "
1. Review and update environment variables:
   - apps/server/.env
   - apps/client/.env (optional)

2. Start development servers:
   bun run dev

3. Access your application:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001
   - Database Studio: bun run db:studio
"

if [[ "$DEPLOY_FLY" == "y" || "$DEPLOY_FLY" == "Y" ]]; then
    echo "
4. Deploy to Fly.io:
   - Install Fly CLI: https://fly.io/docs/flyctl/install/
   - Authenticate: fly auth login
   - Create apps: 
     fly apps create ${FLY_APP_NAME}-client
     fly apps create ${FLY_APP_NAME}-server
   - Set secrets: fly secrets set --app ${FLY_APP_NAME}-server
   - Deploy: bun run deploy
"
fi

print_color "$GREEN" "\n🎉 Happy coding!"