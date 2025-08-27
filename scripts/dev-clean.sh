#!/bin/bash

# Clean development startup script
# Ensures no orphaned processes before starting

echo "🧹 Cleaning up any existing processes..."

# Kill any existing bun watch processes
if pgrep -f "bun --watch" > /dev/null; then
    echo "Found existing bun processes, stopping them..."
    pkill -f "bun --watch"
    sleep 2
fi

# Kill any processes on our dev ports
lsof -ti:3001 | xargs -r kill -9 2>/dev/null || true
lsof -ti:5173 | xargs -r kill -9 2>/dev/null || true

echo "✅ Cleanup complete"
echo "🚀 Starting development servers..."

# Start the dev servers
bun run dev