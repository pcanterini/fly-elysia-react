# Build stage
FROM oven/bun:1 as builder

# Install Python and build tools for optional native dependencies
RUN apt-get update && apt-get install -y python3 python3-pip build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace config and package files
COPY package.json bun.lock ./
COPY apps/client/package.json ./apps/client/
COPY packages/shared/package.json ./packages/shared/

# Copy shared package source
COPY packages/shared ./packages/shared

WORKDIR /app/apps/client

# Install client dependencies (will resolve workspace dependencies)
RUN cd /app && bun install

# Copy client source
COPY apps/client ./

# Set environment variable for Docker development build
ENV VITE_API_URL=http://localhost:3001

# Build the app
RUN bun run build

# Production stage with Caddy
FROM caddy:2-alpine

# Copy built assets
COPY --from=builder /app/apps/client/dist /usr/share/caddy

# Copy Caddyfile from builder stage
COPY --from=builder /app/apps/client/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
