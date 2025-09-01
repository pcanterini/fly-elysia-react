#!/bin/bash

# Full-Stack Template Initialization Script
# This script helps you set up a new project from the template

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Get current directory name as default project name
DEFAULT_PROJECT_NAME=$(basename "$PWD" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')

print_color "$CYAN" "
┌──────────────────────────────────────────────────────────┐
│          Full-Stack Template Initialization              │
│       React + Elysia + Bun + Fly.io Template            │
└──────────────────────────────────────────────────────────┘
"

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    print_color "$RED" "Error: Bun is not installed!"
    print_color "$YELLOW" "Please install Bun first: https://bun.sh"
    exit 1
fi

# Get project name
echo ""
echo -e "${GREEN}◆${NC} Project name ${DIM}($DEFAULT_PROJECT_NAME)${NC}"
read -p "  " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-$DEFAULT_PROJECT_NAME}

# Validate project name
if [[ ! "$PROJECT_NAME" =~ ^[a-z][a-z0-9-]*$ ]]; then
    print_color "$RED" "Invalid project name! Use lowercase letters, numbers, and hyphens only."
    exit 1
fi

echo -e "${GREEN}◆${NC} Project description ${DIM}(A full-stack application)${NC}"
read -p "  " PROJECT_DESCRIPTION
PROJECT_DESCRIPTION=${PROJECT_DESCRIPTION:-"A full-stack application"}

# Get deployment preferences
echo -e "${GREEN}◆${NC} Deploy to Fly.io? ${DIM}(Y/n)${NC}"
read -p "  " DEPLOY_FLY
DEPLOY_FLY=${DEPLOY_FLY:-y}

FLY_APP_NAME=""
if [[ "$DEPLOY_FLY" == "y" || "$DEPLOY_FLY" == "Y" || "$DEPLOY_FLY" == "" ]]; then
    echo -e "${GREEN}◆${NC} Fly.io app name prefix ${DIM}($PROJECT_NAME)${NC}"
    echo -e "  ${DIM}(will create ${PROJECT_NAME}-client and ${PROJECT_NAME}-server)${NC}"
    read -p "  " FLY_APP_NAME
    FLY_APP_NAME=${FLY_APP_NAME:-$PROJECT_NAME}
fi

# Database setup
DEFAULT_DB_NAME="${PROJECT_NAME//-/_}_db"
echo -e "${GREEN}◆${NC} PostgreSQL database name ${DIM}($DEFAULT_DB_NAME)${NC}"
read -p "  " DB_NAME
DB_NAME=${DB_NAME:-$DEFAULT_DB_NAME}

echo ""
print_color "$CYAN" "Starting project initialization..."

# Update package.json files
echo -e "${DIM}  ↳ Updating package.json files...${NC}"

# Root package.json
if [ -f "package.json" ]; then
    sed -i.bak "s/\"name\": \"full-stack-template\"/\"name\": \"$PROJECT_NAME\"/" package.json
    rm package.json.bak
fi

# Update Fly.io configs if needed
if [[ "$DEPLOY_FLY" == "y" || "$DEPLOY_FLY" == "Y" || "$DEPLOY_FLY" == "" ]]; then
    echo -e "${DIM}  ↳ Updating Fly.io configuration...${NC}"
    
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
echo -e "${DIM}  ↳ Creating environment files...${NC}"

# Server .env
if [ -f "apps/server/.env.example" ]; then
    cp apps/server/.env.example apps/server/.env
    
    # Update database name
    sed -i.bak "s/your_database_name/$DB_NAME/" apps/server/.env
    
    # Generate auth secret (use hex to avoid special characters)
    AUTH_SECRET=$(openssl rand -hex 32)
    sed -i.bak "s/your-secret-key-min-32-chars-change-in-production/$AUTH_SECRET/" apps/server/.env
    
    # Update production URL if Fly.io is used
    if [[ "$DEPLOY_FLY" == "y" || "$DEPLOY_FLY" == "Y" || "$DEPLOY_FLY" == "" ]]; then
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
    if [[ "$DEPLOY_FLY" == "y" || "$DEPLOY_FLY" == "Y" || "$DEPLOY_FLY" == "" ]]; then
        echo "" >> apps/client/.env
        echo "# Production API URL (uncomment after deployment)" >> apps/client/.env
        echo "# VITE_API_URL=https://${FLY_APP_NAME}-server.fly.dev" >> apps/client/.env
    fi
    
    rm apps/client/.env.bak
fi

# Install dependencies
echo -e "${DIM}  ↳ Installing dependencies with Bun...${NC}"
bun install

# Initialize git repository
if [ ! -d ".git" ]; then
    echo -e "${DIM}  ↳ Initializing git repository...${NC}"
    git init > /dev/null 2>&1
    git add . > /dev/null 2>&1
    git commit -m "Initial commit from template" > /dev/null 2>&1
fi

# Create initial database if Docker is available
if command -v docker &> /dev/null; then
    echo ""
    echo -e "${GREEN}◆${NC} Start PostgreSQL and Redis with Docker? ${DIM}(Y/n)${NC}"
    read -p "  " START_DB
    START_DB=${START_DB:-y}
    
    if [[ "$START_DB" == "y" || "$START_DB" == "Y" || "$START_DB" == "" ]]; then
        echo -e "${DIM}  ↳ Starting PostgreSQL and Redis...${NC}"
        docker-compose up -d postgres redis
        
        # Wait for database to be ready
        echo -e "${DIM}  ↳ Waiting for database to be ready...${NC}"
        sleep 3
        
        # Create the database
        echo -e "${DIM}  ↳ Creating database if it doesn't exist...${NC}"
        ./scripts/create-database.sh "$DB_NAME" "postgres" "postgres" > /dev/null 2>&1
        
        # Run migrations
        echo -e "${DIM}  ↳ Running database migrations...${NC}"
        cd apps/server && bun run db:push && cd ../..
    fi
fi

echo ""
print_color "$GREEN" "✓ Project initialization complete!"

# Print next steps
echo ""
print_color "$CYAN" "Next Steps:"
echo -e "${DIM}
1. Review and update environment variables:
   • apps/server/.env
   • apps/client/.env (optional)

2. Start development servers:
   ${NC}bun run dev${DIM}

3. Access your application:
   • Frontend: ${NC}http://localhost:5173${DIM}
   • Backend: ${NC}http://localhost:3001${DIM}
   • Database Studio: ${NC}bun run db:studio${DIM}
${NC}"

if [[ "$DEPLOY_FLY" == "y" || "$DEPLOY_FLY" == "Y" || "$DEPLOY_FLY" == "" ]]; then
    echo -e "${DIM}4. Deploy to Fly.io:
   • Install Fly CLI: ${NC}https://fly.io/docs/flyctl/install/${DIM}
   • Authenticate: ${NC}fly auth login${DIM}
   • Create apps:
     ${NC}fly apps create ${FLY_APP_NAME}-client
     fly apps create ${FLY_APP_NAME}-server${DIM}
   • Set up production database (required!):
     ${YELLOW}⚠ You must set DATABASE_URL and REDIS_URL secrets${DIM}
     ${NC}fly secrets set --app ${FLY_APP_NAME}-server \\
       DATABASE_URL="postgresql://..." \\
       REDIS_URL="redis://..."${DIM}
   • Deploy: ${NC}bun run deploy${DIM}
${NC}"
fi

print_color "$GREEN" "Happy coding!"