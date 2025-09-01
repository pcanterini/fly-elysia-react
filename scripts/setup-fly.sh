#!/bin/bash

# Fly.io Setup Script
# This script helps you set up and deploy your application to Fly.io

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
DIM='\033[2m'
NC='\033[0m' # No Color

print_color() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Get default app prefix from current directory
DEFAULT_PREFIX=$(basename "$PWD" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')

print_color "$CYAN" "
┌──────────────────────────────────────────────────────────┐
│                 Fly.io Setup Assistant                   │
└──────────────────────────────────────────────────────────┘
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
    CLIENT_APP=$(grep "^app = " fly.client.toml | sed "s/app = //g" | tr -d "'\"")
fi

if [ -f "fly.server.toml" ]; then
    SERVER_APP=$(grep "^app = " fly.server.toml | sed "s/app = //g" | tr -d "'\"")
fi

if [[ "$CLIENT_APP" == "YOUR-APP-NAME-client" ]] || [[ -z "$CLIENT_APP" ]]; then
    echo ""
    echo -e "${GREEN}◆${NC} Fly.io app name prefix ${DIM}($DEFAULT_PREFIX)${NC}"
    echo -e "  ${DIM}(will create ${DEFAULT_PREFIX}-client and ${DEFAULT_PREFIX}-server)${NC}"
    read -p "  " APP_PREFIX
    APP_PREFIX=${APP_PREFIX:-$DEFAULT_PREFIX}
    
    CLIENT_APP="${APP_PREFIX}-client"
    SERVER_APP="${APP_PREFIX}-server"
    
    # Update fly.toml files (maintaining double quotes in the file)
    sed -i.bak "s/\"YOUR-APP-NAME-client\"/\"$CLIENT_APP\"/" fly.client.toml
    sed -i.bak "s/\"YOUR-APP-NAME-server\"/\"$SERVER_APP\"/" fly.server.toml
    rm fly.client.toml.bak fly.server.toml.bak
fi

echo ""
print_color "$CYAN" "Setting up Fly.io apps:"
echo -e "${DIM}  • Client: $CLIENT_APP"
echo -e "  • Server: $SERVER_APP${NC}"

# Ask if user wants to create apps
echo ""
echo -e "${GREEN}◆${NC} Create Fly.io applications? ${DIM}(Y/n)${NC}"
read -p "  " CREATE_APPS
CREATE_APPS=${CREATE_APPS:-y}

if [[ "$CREATE_APPS" == "y" || "$CREATE_APPS" == "Y" || "$CREATE_APPS" == "" ]]; then
    echo ""
    print_color "$CYAN" "Creating Fly.io applications..."
    
    # Check if apps already exist
    if fly apps list | grep -q "$CLIENT_APP"; then
        echo -e "${DIM}  ✓ Client app already exists: $CLIENT_APP${NC}"
    else
        echo -e "${DIM}  ↳ Creating client app: $CLIENT_APP${NC}"
        fly apps create "$CLIENT_APP" || true
    fi

    if fly apps list | grep -q "$SERVER_APP"; then
        echo -e "${DIM}  ✓ Server app already exists: $SERVER_APP${NC}"
    else
        echo -e "${DIM}  ↳ Creating server app: $SERVER_APP${NC}"
        fly apps create "$SERVER_APP" || true
    fi
fi

# Function to check if neonctl is available
check_neonctl() {
    if command -v neonctl &> /dev/null || command -v neon &> /dev/null; then
        return 0
    fi
    return 1
}

# Database setup
echo ""
print_color "$CYAN" "Database Setup"
echo -e "${YELLOW}◆ PostgreSQL is required for this application${NC}"
echo ""

echo -e "${GREEN}◆${NC} Configure PostgreSQL database? ${DIM}(Y/n)${NC}"
read -p "  " SETUP_DB
SETUP_DB=${SETUP_DB:-y}

if [[ "$SETUP_DB" == "y" || "$SETUP_DB" == "Y" || "$SETUP_DB" == "" ]]; then
    echo ""
    echo "Choose database option:"
    echo -e "  ${DIM}1)${NC} Create new Neon database ${DIM}(automated)${NC}"
    echo -e "  ${DIM}2)${NC} Use existing database URL ${DIM}(manual)${NC}"
    echo -e "  ${DIM}3)${NC} Skip"
    echo ""
    echo -e "${GREEN}◆${NC} Select option ${DIM}(1)${NC}"
    read -p "  " DB_CHOICE
    DB_CHOICE=${DB_CHOICE:-1}
    
    if [ "$DB_CHOICE" = "1" ]; then
        # Check if neonctl is installed
        if ! check_neonctl; then
            echo -e "${YELLOW}  Neon CLI not found${NC}"
            echo -e "${GREEN}◆${NC} Install Neon CLI? ${DIM}(Y/n)${NC}"
            read -p "  " INSTALL_NEON
            INSTALL_NEON=${INSTALL_NEON:-y}
            
            if [[ "$INSTALL_NEON" == "y" || "$INSTALL_NEON" == "Y" || "$INSTALL_NEON" == "" ]]; then
                echo -e "${DIM}  ↳ Installing Neon CLI via npm...${NC}"
                npm install -g neonctl 2>/dev/null || {
                    print_color "$YELLOW" "  Failed to install Neon CLI via npm"
                    echo -e "${GREEN}◆${NC} Try using npx instead? ${DIM}(Y/n)${NC}"
                    read -p "  " USE_NPX
                    USE_NPX=${USE_NPX:-y}
                    if [[ "$USE_NPX" == "y" || "$USE_NPX" == "Y" || "$USE_NPX" == "" ]]; then
                        NEON_CMD="npx neonctl"
                    else
                        DB_CHOICE="2"  # Fall back to manual entry
                    fi
                }
                NEON_CMD=${NEON_CMD:-"neonctl"}
            else
                DB_CHOICE="2"  # Fall back to manual entry
            fi
        else
            # Determine which command is available
            if command -v neonctl &> /dev/null; then
                NEON_CMD="neonctl"
            else
                NEON_CMD="neon"
            fi
        fi
        
        if [ "$DB_CHOICE" = "1" ]; then
            # Ensure user is authenticated with Neon
            echo -e "${DIM}  ↳ Ensuring Neon authentication...${NC}"
            
            # Try a simple command to check auth status
            if ! $NEON_CMD projects list --output json &>/dev/null; then
                echo -e "${DIM}  Opening browser for authentication...${NC}"
                # Just run auth - let it show its own output
                $NEON_CMD auth
                # After auth completes (successfully or not), just continue
                echo ""
            fi
            
            if [ "$DB_CHOICE" = "1" ]; then
                # Create Neon project with name based on app prefix
                PROJECT_NAME="${APP_PREFIX:-$SERVER_APP}"
                echo -e "${DIM}  ↳ Creating Neon project: $PROJECT_NAME${NC}"
                
                # Create project with JSON output
                echo ""
                PROJECT_OUTPUT=$($NEON_CMD projects create --name "$PROJECT_NAME" --output json 2>&1)
                CREATE_STATUS=$?
                
                if [ $CREATE_STATUS -ne 0 ]; then
                    print_color "$YELLOW" "  Failed to create Neon project"
                    if echo "$PROJECT_OUTPUT" | grep -q "already exists"; then
                        echo -e "${DIM}  A project with this name already exists${NC}"
                        echo -e "${GREEN}◆${NC} Use existing project? ${DIM}(Y/n)${NC}"
                        read -p "  " USE_EXISTING
                        USE_EXISTING=${USE_EXISTING:-y}
                        
                        if [[ "$USE_EXISTING" == "y" || "$USE_EXISTING" == "Y" || "$USE_EXISTING" == "" ]]; then
                            # Try to get the existing project
                            echo -e "${DIM}  ↳ Getting project details...${NC}"
                            PROJECTS_OUTPUT=$($NEON_CMD projects list --output json 2>/dev/null)
                            if command -v jq &> /dev/null; then
                                PROJECT_ID=$(echo "$PROJECTS_OUTPUT" | jq -r ".projects[] | select(.name==\"$PROJECT_NAME\") | .id" 2>/dev/null | head -1)
                            else
                                PROJECT_ID=""
                            fi
                        fi
                    fi
                    
                    if [ -z "$PROJECT_ID" ]; then
                        echo ""
                        echo -e "${GREEN}◆${NC} Enter database URL manually:"
                        read -p "  " DATABASE_URL
                        DB_CHOICE="manual"
                    fi
                else
                    # Parse project creation output
                    if command -v jq &> /dev/null; then
                        PROJECT_ID=$(echo "$PROJECT_OUTPUT" | jq -r '.project.id' 2>/dev/null)
                        DEFAULT_BRANCH=$(echo "$PROJECT_OUTPUT" | jq -r '.branch.name // .branch.id' 2>/dev/null)
                        ENDPOINT_ID=$(echo "$PROJECT_OUTPUT" | jq -r '.endpoints[0].id' 2>/dev/null)
                    else
                        PROJECT_ID=$(echo "$PROJECT_OUTPUT" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
                        DEFAULT_BRANCH="main"
                    fi
                    
                    if [ ! -z "$PROJECT_ID" ]; then
                        echo -e "${GREEN}  ✓ Neon project created${NC}"
                        echo -e "${DIM}  Project: $PROJECT_NAME${NC}"
                        echo -e "${DIM}  ID: $PROJECT_ID${NC}"
                    fi
                fi
                
                # If we have a project ID, get or create database and get connection string
                if [ ! -z "$PROJECT_ID" ] && [ "$DB_CHOICE" = "1" ]; then
                    # Check if database exists or create one
                    echo -e "${DIM}  ↳ Setting up database...${NC}"
                    
                    # List databases in the project
                    DBS_OUTPUT=$($NEON_CMD databases list --project-id "$PROJECT_ID" --output json 2>/dev/null)
                    
                    if command -v jq &> /dev/null; then
                        # Check if neondb exists
                        DB_EXISTS=$(echo "$DBS_OUTPUT" | jq -r '.databases[] | select(.name=="neondb") | .name' 2>/dev/null)
                    else
                        DB_EXISTS=""
                    fi
                    
                    if [ -z "$DB_EXISTS" ]; then
                        # Create database if it doesn't exist
                        echo -e "${DIM}  ↳ Creating database 'neondb'...${NC}"
                        $NEON_CMD databases create --name neondb --project-id "$PROJECT_ID" &>/dev/null || true
                    fi
                    
                    # Get connection string
                    echo -e "${DIM}  ↳ Getting connection string...${NC}"
                    CONNECTION_OUTPUT=$($NEON_CMD connection-string --project-id "$PROJECT_ID" --database neondb --output json 2>/dev/null)
                    
                    if [ ! -z "$CONNECTION_OUTPUT" ]; then
                        if command -v jq &> /dev/null; then
                            DATABASE_URL=$(echo "$CONNECTION_OUTPUT" | jq -r '.connection_uri' 2>/dev/null)
                        else
                            DATABASE_URL=$(echo "$CONNECTION_OUTPUT" | grep -o '"connection_uri":"[^"]*' | cut -d'"' -f4 | sed 's/\\//g')
                        fi
                    fi
                    
                    # If still no connection string, try alternate method
                    if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "null" ]; then
                        CONNECTION_OUTPUT=$($NEON_CMD connection-string --project-id "$PROJECT_ID" 2>/dev/null)
                        if [ ! -z "$CONNECTION_OUTPUT" ]; then
                            DATABASE_URL="$CONNECTION_OUTPUT"
                        fi
                    fi
                    
                    if [ ! -z "$DATABASE_URL" ] && [ "$DATABASE_URL" != "null" ]; then
                        echo -e "${GREEN}  ✓ Database ready${NC}"
                        echo -e "${DIM}  ↳ Setting DATABASE_URL secret...${NC}"
                        fly secrets set DATABASE_URL="$DATABASE_URL" --app "$SERVER_APP" &>/dev/null
                        echo -e "${GREEN}  ✓ Database configured in Fly${NC}"
                    else
                        print_color "$YELLOW" "  Could not get connection string automatically"
                        echo -e "${DIM}  Visit: https://console.neon.tech/app/projects/${PROJECT_ID}${NC}"
                        echo -e "${GREEN}◆${NC} Enter database URL manually:"
                        read -p "  " DATABASE_URL
                        if [ ! -z "$DATABASE_URL" ]; then
                            echo -e "${DIM}  ↳ Setting DATABASE_URL secret...${NC}"
                            fly secrets set DATABASE_URL="$DATABASE_URL" --app "$SERVER_APP" &>/dev/null
                            echo -e "${GREEN}  ✓ Database configured${NC}"
                        fi
                    fi
                fi
            fi
        fi
    elif [ "$DB_CHOICE" = "2" ]; then
        echo ""
        echo -e "${GREEN}◆${NC} PostgreSQL connection URL:"
        echo -e "${DIM}  Format: postgresql://user:password@host:port/database${NC}"
        echo -e "${DIM}  Providers: Neon, Supabase, Railway, or any PostgreSQL service${NC}"
        read -p "  " DATABASE_URL
    fi
    
    # Set the DATABASE_URL if provided
    if [ ! -z "$DATABASE_URL" ] && [ "$DB_CHOICE" != "1" ]; then
        echo -e "${DIM}  ↳ Setting DATABASE_URL secret...${NC}"
        fly secrets set DATABASE_URL="$DATABASE_URL" --app "$SERVER_APP"
        echo -e "${GREEN}  ✓ Database configured${NC}"
    elif [ -z "$DATABASE_URL" ] && [ "$DB_CHOICE" != "3" ]; then
        print_color "$YELLOW" "  ⚠ Warning: No database URL provided. You'll need to set it later:"
        print_color "$DIM" "  fly secrets set DATABASE_URL=\"postgresql://...\" --app $SERVER_APP"
    fi
else
    print_color "$YELLOW" "  ⚠ Skipping database setup. Set it later with:"
    print_color "$DIM" "  fly secrets set DATABASE_URL=\"postgresql://...\" --app $SERVER_APP"
fi

# Redis setup with Fly Redis option
echo ""
print_color "$CYAN" "Redis Setup (Job Queue)"
echo -e "${GREEN}◆${NC} Configure Redis for job queues? ${DIM}(Y/n)${NC}"
read -p "  " SETUP_REDIS
SETUP_REDIS=${SETUP_REDIS:-y}

if [[ "$SETUP_REDIS" == "y" || "$SETUP_REDIS" == "Y" || "$SETUP_REDIS" == "" ]]; then
    echo ""
    echo "Choose Redis option:"
    echo -e "  ${DIM}1)${NC} Create Fly Redis via Upstash ${DIM}(recommended)${NC}"
    echo -e "  ${DIM}2)${NC} Use external Redis URL"
    echo -e "  ${DIM}3)${NC} Skip"
    echo ""
    echo -e "${GREEN}◆${NC} Select option ${DIM}(1)${NC}"
    read -p "  " REDIS_CHOICE
    REDIS_CHOICE=${REDIS_CHOICE:-1}

    if [ "$REDIS_CHOICE" = "1" ]; then
        echo -e "${DIM}  ↳ Creating Upstash Redis instance via Fly...${NC}"
        
        # Create Upstash Redis via Fly
        fly redis create --name "${SERVER_APP}-redis" --no-replicas --region sea 2>/dev/null || {
            print_color "$YELLOW" "  Failed to create Redis. You may need to link your Upstash account first."
            echo ""
            echo -e "${GREEN}◆${NC} Link Upstash account now? ${DIM}(Y/n)${NC}"
            read -p "  " LINK_UPSTASH
            LINK_UPSTASH=${LINK_UPSTASH:-y}
            
            if [[ "$LINK_UPSTASH" == "y" || "$LINK_UPSTASH" == "Y" || "$LINK_UPSTASH" == "" ]]; then
                print_color "$CYAN" "  Opening browser to link Upstash account..."
                fly redis create --name "${SERVER_APP}-redis" --no-replicas --region sea
                echo ""
                echo -e "${GREEN}◆${NC} Once linked, enter your Redis URL:"
                read -p "  " REDIS_URL
                if [ ! -z "$REDIS_URL" ]; then
                    fly secrets set REDIS_URL="$REDIS_URL" --app "$SERVER_APP"
                    echo -e "${GREEN}  ✓ Redis configured${NC}"
                fi
            fi
        }
        
        # If Redis creation succeeded, get the connection details
        if fly redis list 2>/dev/null | grep -q "${SERVER_APP}-redis"; then
            echo -e "${DIM}  ↳ Attaching Redis to application...${NC}"
            fly redis attach "${SERVER_APP}-redis" --app "$SERVER_APP" || true
            echo -e "${GREEN}  ✓ Redis created and attached${NC}"
        fi
        
    elif [ "$REDIS_CHOICE" = "2" ]; then
        echo ""
        echo -e "${GREEN}◆${NC} Redis URL:"
        echo -e "${DIM}  Format: redis://[user]:password@host:port${NC}"
        read -p "  " REDIS_URL
        
        if [ ! -z "$REDIS_URL" ]; then
            fly secrets set REDIS_URL="$REDIS_URL" --app "$SERVER_APP"
            echo -e "${GREEN}  ✓ Redis configured${NC}"
        fi
    fi
else
    print_color "$YELLOW" "  ⚠ Skipping Redis setup. Set it later with:"
    print_color "$DIM" "  fly secrets set REDIS_URL=\"redis://...\" --app $SERVER_APP"
fi

# Set other required secrets
echo ""
echo -e "${GREEN}◆${NC} Configure authentication secrets? ${DIM}(Y/n)${NC}"
read -p "  " SETUP_AUTH
SETUP_AUTH=${SETUP_AUTH:-y}

if [[ "$SETUP_AUTH" == "y" || "$SETUP_AUTH" == "Y" || "$SETUP_AUTH" == "" ]]; then
    echo ""
    print_color "$CYAN" "Setting up authentication secrets..."
    
    # Generate auth secret if not provided
    echo -e "${DIM}  ↳ Generating authentication secret...${NC}"
    AUTH_SECRET=$(openssl rand -hex 32)
    fly secrets set BETTER_AUTH_SECRET="$AUTH_SECRET" --app "$SERVER_APP" 2>/dev/null
    
    # Set auth URL
    AUTH_URL="https://${SERVER_APP}.fly.dev"
    fly secrets set BETTER_AUTH_URL="$AUTH_URL" --app "$SERVER_APP" 2>/dev/null
    
    echo -e "${GREEN}  ✓ Secrets configured${NC}"
fi

# List all secrets (without values)
echo ""
print_color "$CYAN" "Configured secrets for $SERVER_APP:"
fly secrets list --app "$SERVER_APP" 2>/dev/null || echo -e "${DIM}  No secrets configured yet${NC}"

# Update client configuration
echo ""
echo -e "${GREEN}◆${NC} Update client with production API URL? ${DIM}(Y/n)${NC}"
read -p "  " UPDATE_CLIENT
UPDATE_CLIENT=${UPDATE_CLIENT:-y}

if [[ "$UPDATE_CLIENT" == "y" || "$UPDATE_CLIENT" == "Y" || "$UPDATE_CLIENT" == "" ]]; then
    if [ -f "apps/client/.env" ]; then
        # Check if VITE_API_URL already exists
        if grep -q "VITE_API_URL=" apps/client/.env; then
            # Update existing
            sed -i.bak "s|VITE_API_URL=.*|VITE_API_URL=https://${SERVER_APP}.fly.dev|" apps/client/.env
            rm apps/client/.env.bak
        else
            # Add new
            echo "" >> apps/client/.env
            echo "# Production API URL" >> apps/client/.env
            echo "VITE_API_URL=https://${SERVER_APP}.fly.dev" >> apps/client/.env
        fi
        echo -e "${GREEN}  ✓ Updated apps/client/.env${NC}"
    fi
fi

# Deployment instructions
echo ""
print_color "$GREEN" "✓ Fly.io setup complete!"
echo ""
print_color "$CYAN" "Next Steps:"
echo -e "${DIM}
1. Build your application:
   ${NC}bun run build${DIM}

2. Deploy to Fly.io:
   ${NC}bun run deploy${DIM}

   Or deploy individually:
   • Client: ${NC}fly deploy --config fly.client.toml${DIM}
   • Server: ${NC}fly deploy --config fly.server.toml${DIM}

3. Open your deployed apps:
   • Client: ${NC}fly open --app $CLIENT_APP${DIM}
   • Server: ${NC}fly open --app $SERVER_APP${DIM}

4. Monitor your apps:
   • Logs: ${NC}fly logs --app $SERVER_APP${DIM}
   • Status: ${NC}fly status --app $SERVER_APP${DIM}
${NC}"

# Check if any secrets still need to be configured
MISSING_CONFIGS=false
if ! fly secrets list --app "$SERVER_APP" 2>/dev/null | grep -q "DATABASE_URL"; then
    MISSING_CONFIGS=true
    DATABASE_MISSING=true
fi
if ! fly secrets list --app "$SERVER_APP" 2>/dev/null | grep -q "REDIS_URL"; then
    MISSING_CONFIGS=true
    REDIS_MISSING=true
fi

if [ "$MISSING_CONFIGS" = true ]; then
    print_color "$YELLOW" "⚠ Important: Missing Configuration"
    echo -e "${DIM}"
    [ "$DATABASE_MISSING" = true ] && echo "  • Set DATABASE_URL before deploying"
    [ "$REDIS_MISSING" = true ] && echo "  • Set REDIS_URL for job queue functionality"
    echo -e "${NC}"
fi

print_color "$YELLOW" "Important Notes:"
echo -e "${DIM}
• First deployment may take a few minutes
• Server must be deployed before client can connect
• Check logs if deployment fails: ${NC}fly logs --app <app-name>${DIM}
• Scale resources as needed: ${NC}fly scale --app <app-name>${DIM}
${NC}"

print_color "$GREEN" "Happy deploying!"