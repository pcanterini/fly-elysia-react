#!/bin/bash

# Check for running development processes

echo "🔍 Checking for running development processes..."
echo ""

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
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "redis-queue|postgres-db" || echo "  None running ✅"