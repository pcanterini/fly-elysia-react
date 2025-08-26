# Build stage
FROM oven/bun:1 as builder

# Install Python and build tools for optional native dependencies
RUN apt-get update && apt-get install -y python3 python3-pip build-essential && rm -rf /var/lib/apt/lists/*

WORKDIR /app/apps/client

# Copy only client package.json
COPY apps/client/package.json ./

# Install client dependencies (build tools needed for better-auth optional deps)
RUN bun install

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
