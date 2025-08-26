FROM oven/bun:1

# Install Python and build tools needed for native dependencies
RUN apt-get update && apt-get install -y python3 python3-pip build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files for dependency installation
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

# Copy shared package source (needed for workspace dependencies)
COPY packages/shared ./packages/shared

# Install dependencies
RUN bun install

# Copy server source code
COPY apps/server ./apps/server

# Set NODE_ENV for the build phase
# This is critical for Bun to evaluate production conditions at build time
# (e.g., cookie settings for cross-origin authentication)
ENV NODE_ENV=production

# Build the server
RUN cd apps/server && bun run build

WORKDIR /app/apps/server

# Copy and set up entrypoint script
COPY apps/server/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3001

CMD ["./docker-entrypoint.sh"]
