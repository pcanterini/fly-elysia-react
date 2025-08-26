#!/bin/bash
set -e

echo "🚀 Starting server with environment: ${NODE_ENV:-development}"

# Start the application directly
echo "🎯 Starting application..."
exec bun start