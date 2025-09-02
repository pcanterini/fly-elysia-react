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