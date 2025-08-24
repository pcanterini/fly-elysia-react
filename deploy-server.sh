#!/bin/bash

# Deploy server to Fly.io
echo "🚀 Deploying server to Fly.io..."

# Deploy the server
fly deploy --config fly.server.toml

if [ $? -eq 0 ]; then
    echo "✅ Server deployed successfully!"
    echo "🌐 Server URL: https://bun-app-server.fly.dev"
else
    echo "❌ Server deployment failed!"
    exit 1
fi
