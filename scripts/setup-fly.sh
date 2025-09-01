#!/bin/bash

# Fly.io Setup Script
# This script helps you set up and deploy your application to Fly.io

set -e

# Error log file
ERROR_LOG="fly-setup-errors.log"
echo "====== Fly.io Setup Script - $(date) ======" > "$ERROR_LOG"

# Function to log errors
log_error() {
    echo "[ERROR] $(date '+%Y-%m-%d %H:%M:%S'): $1" >> "$ERROR_LOG"
}

# Trap errors and log them
trap 'log_error "Script failed at line $LINENO with exit code $?"' ERR

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
        if ! fly apps create "$CLIENT_APP" 2>&1 | tee -a "$ERROR_LOG"; then
            log_error "Failed to create client app: $CLIENT_APP"
            echo -e "${RED}  ✗ Failed to create client app${NC}"
            echo -e "${YELLOW}  App '$CLIENT_APP' may already exist or there was an error${NC}"
            echo -e "${DIM}  Try a different app name or check 'fly apps list'${NC}"
            echo -e "${DIM}  Error log saved to: $ERROR_LOG${NC}"
            exit 1
        fi
        echo -e "${GREEN}  ✓ Client app created${NC}"
    fi

    if fly apps list | grep -q "$SERVER_APP"; then
        echo -e "${DIM}  ✓ Server app already exists: $SERVER_APP${NC}"
    else
        echo -e "${DIM}  ↳ Creating server app: $SERVER_APP${NC}"
        if ! fly apps create "$SERVER_APP" 2>&1 | tee -a "$ERROR_LOG"; then
            log_error "Failed to create server app: $SERVER_APP"
            echo -e "${RED}  ✗ Failed to create server app${NC}"
            echo -e "${YELLOW}  App '$SERVER_APP' may already exist or there was an error${NC}"
            echo -e "${DIM}  Try a different app name or check 'fly apps list'${NC}"
            echo -e "${DIM}  Error log saved to: $ERROR_LOG${NC}"
            exit 1
        fi
        echo -e "${GREEN}  ✓ Server app created${NC}"
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
            # Check if neonctl credentials exist
            if [ ! -f "$HOME/.config/neonctl/credentials.json" ]; then
                echo -e "${YELLOW}  Neon authentication required${NC}"
                echo -e "${DIM}  This will open your browser${NC}"
                $NEON_CMD auth
                echo ""
            else
                echo -e "${DIM}  Using existing Neon credentials${NC}"
                echo -e "${GREEN}◆${NC} Re-authenticate with Neon? ${DIM}(y/N)${NC}"
                echo -e "${DIM}  Choose 'y' if you're having authentication issues${NC}"
                read -p "  " REAUTH
                REAUTH=${REAUTH:-n}
                if [[ "$REAUTH" == "y" || "$REAUTH" == "Y" ]]; then
                    $NEON_CMD auth
                    echo ""
                fi
            fi
            
            if [ "$DB_CHOICE" = "1" ]; then
                # Create Neon project with name based on app prefix
                PROJECT_NAME="${APP_PREFIX:-$SERVER_APP}"
                echo -e "${DIM}  ↳ Creating Neon project: $PROJECT_NAME${NC}"
                echo -e "${DIM}  Region: AWS US West 2 (Oregon)${NC}"
                echo -e "${DIM}  Note: You may be prompted to select an organization${NC}"
                
                # Create project with JSON output in Oregon region
                echo ""
                PROJECT_OUTPUT=$($NEON_CMD projects create --name "$PROJECT_NAME" --region-id aws-us-west-2 --output json 2>&1)
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
                    # Parse project creation output to extract connection URI directly
                    if command -v jq &> /dev/null; then
                        PROJECT_ID=$(echo "$PROJECT_OUTPUT" | jq -r '.project.id' 2>/dev/null)
                        DATABASE_URL=$(echo "$PROJECT_OUTPUT" | jq -r '.connection_uris[0].connection_uri' 2>/dev/null)
                    else
                        PROJECT_ID=$(echo "$PROJECT_OUTPUT" | grep -o '"id":"[^"]*' | grep -o '"project":{[^}]*"id":"[^"]*' | tail -1 | cut -d'"' -f4)
                        DATABASE_URL=$(echo "$PROJECT_OUTPUT" | grep -o '"connection_uri":"[^"]*' | head -1 | cut -d'"' -f4)
                    fi
                    
                    # Validate we got good values
                    if [ ! -z "$PROJECT_ID" ] && [ "$PROJECT_ID" != "null" ]; then
                        echo -e "${GREEN}  ✓ Neon project created${NC}"
                        echo -e "${DIM}  Project: $PROJECT_NAME${NC}"
                        echo -e "${DIM}  ID: $PROJECT_ID${NC}"
                        
                        # If we didn't get connection URL from creation, get it separately
                        if [ -z "$DATABASE_URL" ] || [ "$DATABASE_URL" = "null" ]; then
                            echo -e "${DIM}  ↳ Getting connection string...${NC}"
                            # connection-string command returns plain text, not JSON
                            DATABASE_URL=$($NEON_CMD connection-string --project-id "$PROJECT_ID" 2>/dev/null)
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
                    else
                        print_color "$YELLOW" "  Failed to parse project creation output"
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
        # Check if Redis instance already exists
        REDIS_NAME="${SERVER_APP}-redis"
        set +e  # Temporarily disable exit on error
        if fly redis list 2>/dev/null | grep -q "$REDIS_NAME"; then
            set -e  # Re-enable exit on error
            echo -e "${DIM}  ✓ Redis instance already exists: $REDIS_NAME${NC}"
            echo -e "${DIM}  ↳ Getting connection details...${NC}"
            
            # Get the Redis URL using status command
            set +e  # Temporarily disable exit on error
            REDIS_STATUS=$(fly redis status "$REDIS_NAME" 2>&1)
            set -e  # Re-enable exit on error
            REDIS_URL=$(echo "$REDIS_STATUS" | grep -o 'redis://[^[:space:]]*' | head -1)
            
            if [ ! -z "$REDIS_URL" ]; then
                echo -e "${GREEN}  ✓ Found existing Redis instance${NC}"
                echo -e "${DIM}  ↳ Setting REDIS_URL secret...${NC}"
                fly secrets set REDIS_URL="$REDIS_URL" --app "$SERVER_APP" &>/dev/null
                echo -e "${GREEN}  ✓ Redis configured in Fly${NC}"
            else
                print_color "$YELLOW" "  Could not get Redis URL from existing instance"
                echo -e "${GREEN}◆${NC} Enter Redis URL manually:"
                read -p "  " REDIS_URL
                if [ ! -z "$REDIS_URL" ]; then
                    fly secrets set REDIS_URL="$REDIS_URL" --app "$SERVER_APP" &>/dev/null
                    echo -e "${GREEN}  ✓ Redis configured${NC}"
                fi
            fi
        else
            set -e  # Re-enable exit on error
            echo -e "${DIM}  ↳ Creating Upstash Redis instance via Fly...${NC}"
            echo -e "${DIM}  You will be prompted about eviction policy${NC}"
            echo ""
            
            # Run Redis creation interactively to allow user to choose eviction
            # Temporarily disable exit on error for Redis creation
            set +e
            fly redis create --name "$REDIS_NAME" --no-replicas --region sea
            REDIS_CREATE_STATUS=$?
            set -e  # Re-enable exit on error
            
            if [ $REDIS_CREATE_STATUS -eq 0 ]; then
                echo ""
                echo -e "${GREEN}  ✓ Redis created successfully${NC}"
                echo -e "${DIM}  Name: ${REDIS_NAME}${NC}"
                echo -e "${DIM}  Region: sea${NC}"
                
                # Get the Redis URL using status command
                echo -e "${DIM}  ↳ Getting connection details...${NC}"
                set +e
                REDIS_STATUS=$(fly redis status "$REDIS_NAME" 2>&1)
                set -e
                REDIS_URL=$(echo "$REDIS_STATUS" | grep -o 'redis://[^[:space:]]*' | head -1)
                
                if [ ! -z "$REDIS_URL" ]; then
                    echo -e "${DIM}  ↳ Setting REDIS_URL secret...${NC}"
                    fly secrets set REDIS_URL="$REDIS_URL" --app "$SERVER_APP" &>/dev/null
                    echo -e "${GREEN}  ✓ Redis configured in Fly${NC}"
                else
                    # If we couldn't extract the URL, ask for manual input
                    print_color "$YELLOW" "  Could not extract URL automatically"
                    echo -e "${GREEN}◆${NC} Enter the Redis URL (check output above):"
                    read -p "  " REDIS_URL
                    if [ ! -z "$REDIS_URL" ]; then
                        fly secrets set REDIS_URL="$REDIS_URL" --app "$SERVER_APP" &>/dev/null
                        echo -e "${GREEN}  ✓ Redis configured${NC}"
                    fi
                fi
            else
                # Since we're running interactively, Redis creation failed or was cancelled
                echo -e "${YELLOW}  Redis creation failed or was cancelled${NC}"
                echo -e "${DIM}  This might be because:${NC}"
                echo -e "${DIM}  - The Redis name already exists${NC}"
                echo -e "${DIM}  - You cancelled the prompt${NC}"
                echo -e "${DIM}  - There was a connection issue${NC}"
                echo ""
                
                echo -e "${GREEN}◆${NC} Try to get existing Redis URL? ${DIM}(Y/n)${NC}"
                read -p "  " GET_EXISTING
                GET_EXISTING=${GET_EXISTING:-y}
                
                if [[ "$GET_EXISTING" == "y" || "$GET_EXISTING" == "Y" || "$GET_EXISTING" == "" ]]; then
                    set +e  # Temporarily disable exit on error
                    REDIS_STATUS=$(fly redis status "$REDIS_NAME" 2>&1)
                    STATUS_CODE=$?
                    set -e  # Re-enable exit on error
                    
                    if [ $STATUS_CODE -eq 0 ]; then
                        REDIS_URL=$(echo "$REDIS_STATUS" | grep -o 'redis://[^[:space:]]*' | head -1)
                        
                        if [ ! -z "$REDIS_URL" ]; then
                            echo -e "${GREEN}  ✓ Found existing Redis instance${NC}"
                            echo -e "${DIM}  ↳ Setting REDIS_URL secret...${NC}"
                            fly secrets set REDIS_URL="$REDIS_URL" --app "$SERVER_APP" &>/dev/null
                            echo -e "${GREEN}  ✓ Redis configured${NC}"
                        else
                            echo -e "${GREEN}◆${NC} Enter Redis URL manually:"
                            read -p "  " REDIS_URL
                            if [ ! -z "$REDIS_URL" ]; then
                                fly secrets set REDIS_URL="$REDIS_URL" --app "$SERVER_APP" &>/dev/null
                                echo -e "${GREEN}  ✓ Redis configured${NC}"
                            fi
                        fi
                    else
                        echo -e "${YELLOW}  No existing Redis instance found with name: ${REDIS_NAME}${NC}"
                        echo -e "${GREEN}◆${NC} Enter Redis URL manually? ${DIM}(y/N)${NC}"
                        read -p "  " MANUAL_ENTRY
                        MANUAL_ENTRY=${MANUAL_ENTRY:-n}
                        
                        if [[ "$MANUAL_ENTRY" == "y" || "$MANUAL_ENTRY" == "Y" ]]; then
                            echo -e "${GREEN}◆${NC} Redis URL:"
                            read -p "  " REDIS_URL
                            if [ ! -z "$REDIS_URL" ]; then
                                fly secrets set REDIS_URL="$REDIS_URL" --app "$SERVER_APP" &>/dev/null
                                echo -e "${GREEN}  ✓ Redis configured${NC}"
                            fi
                        fi
                    fi
                fi
            fi
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