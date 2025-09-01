#!/bin/bash

# Check for running development processes

echo "🔍 Checking for running development processes..."
echo ""

# Check for conflicting containers from other projects
echo "⚠️  Checking for conflicting containers from other projects..."
REDIS_CONTAINERS=$(docker ps --filter "ancestor=redis:7-alpine" --format "{{.Names}}" 2>/dev/null)
POSTGRES_CONTAINERS=$(docker ps --filter "ancestor=postgres:16" --format "{{.Names}}" 2>/dev/null)

if [ ! -z "$REDIS_CONTAINERS" ] || [ ! -z "$POSTGRES_CONTAINERS" ]; then
    echo "  ❌ Found containers from other projects:"
    [ ! -z "$REDIS_CONTAINERS" ] && echo "     Redis: $REDIS_CONTAINERS"
    [ ! -z "$POSTGRES_CONTAINERS" ] && echo "     PostgreSQL: $POSTGRES_CONTAINERS"
    echo ""
    echo "  💡 Run 'bun run dev:clean' to stop these containers before starting"
    echo ""
else
    echo "  ✅ No conflicting containers found"
    echo ""
fi

# Check for bun processes
echo "Bun processes:"
ps aux | grep "bun.*watch" | grep -v grep || echo "  None found ✅"
echo ""

# Check ports
echo "Port 3001 (Server):"
lsof -i:3001 || echo "  Free ✅"
echo ""

echo "Port 5173 (Client):"
lsof -i:5173 || echo "  Free ✅"
echo ""

echo "Port 5432 (PostgreSQL):"
lsof -i:5432 | grep -v COMMAND || echo "  Free ✅"
echo ""

echo "Port 6379 (Redis):"
lsof -i:6379 | grep -v COMMAND || echo "  Free ✅"
echo ""

# Check Docker containers
echo "Docker containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "redis|postgres" || echo "  None running ✅"