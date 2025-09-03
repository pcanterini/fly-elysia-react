#!/bin/bash

# Script to ensure correct machine scaling after deployment
# This prevents Fly.io from creating duplicate machines

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

# Check if apps are configured
if [[ "$SERVER_APP" == "YOUR-APP-NAME-server" ]] || [[ -z "$SERVER_APP" ]]; then
    print_color "$RED" "Error: Server app name not configured in fly.server.toml"
    print_color "$YELLOW" "Please run ./scripts/setup-fly.sh first to configure your apps"
    exit 1
fi

if [[ "$CLIENT_APP" == "YOUR-APP-NAME-client" ]] || [[ -z "$CLIENT_APP" ]]; then
    print_color "$RED" "Error: Client app name not configured in fly.client.toml"
    print_color "$YELLOW" "Please run ./scripts/setup-fly.sh first to configure your apps"
    exit 1
fi

# Scale server app - exactly 1 machine per process group
print_color "$CYAN" "Scaling server app: $SERVER_APP"
if fly scale count web=1 worker=1 --app "$SERVER_APP" --yes 2>/dev/null; then
    echo -e "${GREEN}  ✓ Server scaled to 1 web + 1 worker machine${NC}"
else
    echo -e "${YELLOW}  ⚠ Could not scale server (app may not be deployed yet)${NC}"
fi

# Scale client app - exactly 1 machine
print_color "$CYAN" "Scaling client app: $CLIENT_APP"
if fly scale count 1 --app "$CLIENT_APP" --yes 2>/dev/null; then
    echo -e "${GREEN}  ✓ Client scaled to 1 machine${NC}"
else
    echo -e "${YELLOW}  ⚠ Could not scale client (app may not be deployed yet)${NC}"
fi

# Show current machine status
print_color "$GREEN" "\n✓ Scaling complete! Current machine status:"
echo ""
print_color "$YELLOW" "Server machines ($SERVER_APP):"
fly machines list --app "$SERVER_APP" 2>/dev/null || echo -e "${DIM}  No machines found (app may not be deployed)${NC}"

echo ""
print_color "$YELLOW" "Client machines ($CLIENT_APP):"
fly machines list --app "$CLIENT_APP" 2>/dev/null || echo -e "${DIM}  No machines found (app may not be deployed)${NC}"

print_color "$GREEN" "\n✓ Done! You should have exactly:"
echo "  • 1 web machine (server)"
echo "  • 1 worker machine (server)"
echo "  • 1 client machine"
echo ""
echo -e "${DIM}Note: If you see more machines than expected, they may be old versions${NC}"
echo -e "${DIM}that will be removed automatically after deployment completes.${NC}"