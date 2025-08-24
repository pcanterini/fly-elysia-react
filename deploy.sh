#!/bin/bash

# Full deployment script for Fly.io
echo "🚀 Starting full deployment to Fly.io..."

# Check if fly CLI is installed
if ! command -v fly &> /dev/null; then
    echo "❌ Fly CLI not found. Please install it first: https://fly.io/docs/getting-started/installing-flyctl/"
    exit 1
fi

# Check if user is logged in
if ! fly auth whoami &> /dev/null; then
    echo "❌ Not logged into Fly.io. Please run 'fly auth login' first."
    exit 1
fi

# Deploy server first (client depends on it)
echo "📡 Step 1: Deploying server..."
fly deploy --config fly.server.toml

if [ $? -eq 0 ]; then
    echo "✅ Server deployed successfully!"
    echo "🌐 Server URL: https://bun-app-server.fly.dev"
else
    echo "❌ Server deployment failed!"
    exit 1
fi

echo ""
echo "⏳ Waiting 10 seconds for server to be ready..."
sleep 10

# Deploy client
echo "🌐 Step 2: Deploying client..."
fly deploy --config fly.client.toml

if [ $? -eq 0 ]; then
    echo "✅ Client deployed successfully!"
    echo "🌐 Client URL: https://bun-app-client.fly.dev"
else
    echo "❌ Client deployment failed!"
    exit 1
fi

echo ""
echo "🎉 Full deployment completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Frontend: https://bun-app-client.fly.dev"
echo "🔗 Backend:  https://bun-app-server.fly.dev"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Tips:"
echo "  • Deploy server only: ./deploy-server.sh"
echo "  • Deploy client only: ./deploy-client.sh"
echo "  • View logs: fly logs --app bun-app-server (or bun-app-client)"
echo "  • Monitor apps: fly status --app bun-app-server"
