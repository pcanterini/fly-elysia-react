#!/bin/bash

# Script to get the correct DNS records after deployment
# Run this after your first deployment to get the actual allocated IPs

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
SERVER_APP=$(grep "^app = " fly.server.toml 2>/dev/null | sed "s/app = //g" | tr -d "'\"" || echo "")
CLIENT_APP=$(grep "^app = " fly.client.toml 2>/dev/null | sed "s/app = //g" | tr -d "'\"" || echo "")

print_color "$CYAN" "
╔══════════════════════════════════════════════════════════╗
║          DNS Records for Your Custom Domain              ║
╚══════════════════════════════════════════════════════════╝
"

# Check if apps are configured
if [[ "$CLIENT_APP" == "YOUR-APP-NAME-client" ]] || [[ -z "$CLIENT_APP" ]]; then
    print_color "$RED" "Error: Apps not configured in fly.toml files"
    print_color "$YELLOW" "Run ./scripts/setup-fly.sh first to configure your apps"
    exit 1
fi

# Check if fly CLI is available
if ! command -v fly &> /dev/null; then
    print_color "$RED" "Error: Fly CLI is not installed!"
    print_color "$YELLOW" "Install it from: https://fly.io/docs/flyctl/install/"
    exit 1
fi

# Get certificates to find domains
echo -e "${DIM}Checking configured domains...${NC}"
CLIENT_CERTS=$(fly certs list --app "$CLIENT_APP" 2>/dev/null | grep -v "Host Name" | grep -v "^$" | awk '{print $1}' || echo "")
SERVER_CERTS=$(fly certs list --app "$SERVER_APP" 2>/dev/null | grep -v "Host Name" | grep -v "^$" | awk '{print $1}' || echo "")

if [ -z "$CLIENT_CERTS" ]; then
    print_color "$YELLOW" "No custom domain configured for client app"
    echo -e "${DIM}Using default .fly.dev domains:${NC}"
    echo -e "  Client: https://${CLIENT_APP}.fly.dev"
    echo -e "  Server: https://${SERVER_APP}.fly.dev"
    echo ""
    echo -e "${DIM}To set up a custom domain, run:${NC}"
    echo -e "${CYAN}  ./scripts/setup-fly.sh${NC}"
    exit 0
fi

# Get main domain and API domain
MAIN_DOMAIN=$(echo "$CLIENT_CERTS" | head -1)
API_DOMAIN=$(echo "$SERVER_CERTS" | head -1)

print_color "$GREEN" "Domains found:"
echo -e "  Main: ${BLUE}$MAIN_DOMAIN${NC}"
if [ ! -z "$API_DOMAIN" ]; then
    echo -e "  API:  ${BLUE}$API_DOMAIN${NC}"
fi
echo ""

# Get actual IPs for client
print_color "$CYAN" "DNS Records to Configure:"
echo ""

CLIENT_IPS=$(fly ips list --app "$CLIENT_APP" 2>/dev/null)
if [ ! -z "$CLIENT_IPS" ]; then
    IPV4=$(echo "$CLIENT_IPS" | grep "^v4" | awk '{print $2}' | head -1)
    IPV6=$(echo "$CLIENT_IPS" | grep "^v6" | awk '{print $2}' | head -1)
    
    echo -e "${YELLOW}For $MAIN_DOMAIN:${NC}"
    
    if [ ! -z "$IPV4" ]; then
        echo -e "${GREEN}  Type: A${NC} ${DIM}(IPv4)${NC}"
        echo -e "  Name: @ ${DIM}(or leave blank for root domain)${NC}"
        echo -e "  Value: ${BLUE}$IPV4${NC}"
        echo ""
    else
        echo -e "${RED}  ⚠ WARNING: No IPv4 address found!${NC}"
        echo -e "${YELLOW}  Your site may not be accessible via IPv4${NC}"
        echo ""
    fi
    
    if [ ! -z "$IPV6" ]; then
        echo -e "${GREEN}  Type: AAAA${NC} ${RED}(REQUIRED for certificate validation)${NC}"
        echo -e "  Name: @ ${DIM}(or leave blank for root domain)${NC}"
        echo -e "  Value: ${BLUE}$IPV6${NC}"
        echo ""
    else
        echo -e "${RED}  ⚠ WARNING: No IPv6 address found!${NC}"
        echo -e "${YELLOW}  The SSL certificate will NOT validate without an IPv6 (AAAA) record${NC}"
        echo -e "${DIM}  Run 'fly ips allocate-v6 --app $CLIENT_APP' to allocate one${NC}"
        echo ""
    fi
    
    echo -e "${YELLOW}⚠ IMPORTANT: BOTH A and AAAA records are REQUIRED!${NC}"
    echo -e "${DIM}Fly.io certificates won't validate without the IPv6 (AAAA) record${NC}"
    echo ""
else
    print_color "$RED" "Could not get IP addresses for $CLIENT_APP"
    print_color "$YELLOW" "Make sure the app is deployed first"
fi

# Show CNAME for API subdomain
if [ ! -z "$API_DOMAIN" ]; then
    # Extract the subdomain part (everything before the first dot)
    API_PREFIX=$(echo "$API_DOMAIN" | cut -d'.' -f1)
    
    echo -e "${YELLOW}For $API_DOMAIN:${NC}"
    echo -e "${GREEN}  Type: CNAME${NC}"
    echo -e "  Name: ${API_PREFIX}"
    echo -e "  Value: ${BLUE}${SERVER_APP}.fly.dev${NC}"
    echo ""
fi

# Check certificate status
print_color "$CYAN" "Certificate Status:"
echo ""

echo -e "${DIM}Client app certificates:${NC}"
fly certs list --app "$CLIENT_APP" 2>/dev/null | grep -v "^$" || echo "  No certificates found"
echo ""

if [ ! -z "$SERVER_APP" ]; then
    echo -e "${DIM}Server app certificates:${NC}"
    fly certs list --app "$SERVER_APP" 2>/dev/null | grep -v "^$" || echo "  No certificates found"
    echo ""
fi

# Show helpful next steps based on certificate status
CLIENT_CERT_STATUS=$(fly certs list --app "$CLIENT_APP" 2>/dev/null | grep "$MAIN_DOMAIN" | awk '{print $NF}' || echo "")

if [[ "$CLIENT_CERT_STATUS" == "Ready" ]]; then
    print_color "$GREEN" "✓ Your SSL certificate is ready and active!"
elif [[ "$CLIENT_CERT_STATUS" == "Awaiting configuration" ]]; then
    print_color "$YELLOW" "⚠ Certificate is awaiting DNS configuration"
    echo -e "${DIM}Make sure to add BOTH the A and AAAA records shown above${NC}"
    echo -e "${DIM}The certificate won't proceed without the IPv6 (AAAA) record${NC}"
elif [[ "$CLIENT_CERT_STATUS" == "Awaiting certificates" ]]; then
    print_color "$YELLOW" "⚠ DNS configured, waiting for certificate issuance"
    echo -e "${DIM}This usually takes a few minutes. If it takes longer than 30 minutes,${NC}"
    echo -e "${DIM}verify your DNS records are correct.${NC}"
fi

echo ""
print_color "$DIM" "Run this script again anytime to check your DNS configuration"