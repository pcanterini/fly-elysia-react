#!/bin/bash

# Script to create the database if it doesn't exist

# Read from .env file if it exists
if [ -f "apps/server/.env" ]; then
    # Extract database credentials from DATABASE_URL
    DATABASE_URL=$(grep "^DATABASE_URL=" apps/server/.env | cut -d '=' -f2-)
    if [ ! -z "$DATABASE_URL" ]; then
        # Parse DATABASE_URL postgresql://user:password@host:port/dbname
        DB_NAME=$(echo $DATABASE_URL | sed 's/.*\///')
        DB_USER=$(echo $DATABASE_URL | sed 's/postgresql:\/\///' | sed 's/:.*$//')
        DB_PASSWORD=$(echo $DATABASE_URL | sed 's/.*:\/\/[^:]*://' | sed 's/@.*//')
    fi
fi

# Use command line arguments or defaults
DB_NAME=${1:-${DB_NAME:-"your_database_name"}}
DB_USER=${2:-${DB_USER:-"postgres"}}
DB_PASSWORD=${3:-${DB_PASSWORD:-"postgres"}}

echo "🗄️  Creating database '$DB_NAME' if it doesn't exist..."

# Wait for PostgreSQL to be ready
for i in {1..10}; do
    if docker exec battle-stations-postgres-1 pg_isready -U $DB_USER &>/dev/null 2>&1 || \
       docker exec $(docker ps -q -f ancestor=postgres:16 | head -1) pg_isready -U $DB_USER &>/dev/null 2>&1; then
        break
    fi
    echo "  Waiting for PostgreSQL to be ready... ($i/10)"
    sleep 1
done

# Try to get the container name dynamically
POSTGRES_CONTAINER=$(docker ps --format "{{.Names}}" | grep postgres | head -1)

if [ -z "$POSTGRES_CONTAINER" ]; then
    echo "❌ No PostgreSQL container found running"
    exit 1
fi

# Create the database if it doesn't exist
docker exec $POSTGRES_CONTAINER psql -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    docker exec $POSTGRES_CONTAINER psql -U $DB_USER -c "CREATE DATABASE \"$DB_NAME\";"

if [ $? -eq 0 ]; then
    echo "✅ Database '$DB_NAME' is ready"
else
    echo "❌ Failed to create database '$DB_NAME'"
    exit 1
fi