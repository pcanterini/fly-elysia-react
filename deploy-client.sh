#!/bin/bash

# Deploy client to Fly.io
echo "🚀 Deploying client to Fly.io..."

# Deploy the client
fly deploy --config fly.client.toml

if [ $? -eq 0 ]; then
    echo "✅ Client deployed successfully!"
    echo "🌐 Client URL: https://bun-app-client.fly.dev"
else
    echo "❌ Client deployment failed!"
    exit 1
fi
