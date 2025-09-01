#!/bin/bash

# Cleanup script to stop conflicting Docker containers from other projects

echo "🧹 Cleaning up Docker containers..."
echo ""

# Stop any Redis containers
echo "Stopping Redis containers..."
docker ps -q --filter "ancestor=redis:7-alpine" | xargs -r docker stop 2>/dev/null || true
docker ps -q --filter "name=redis" | xargs -r docker stop 2>/dev/null || true
echo "✅ Redis containers stopped"
echo ""

# Stop any PostgreSQL containers
echo "Stopping PostgreSQL containers..."
docker ps -q --filter "ancestor=postgres:16" | xargs -r docker stop 2>/dev/null || true
docker ps -q --filter "name=postgres" | xargs -r docker stop 2>/dev/null || true
echo "✅ PostgreSQL containers stopped"
echo ""

echo "✨ Cleanup complete!"