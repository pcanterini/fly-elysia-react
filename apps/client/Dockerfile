# Build stage
FROM oven/bun:1 as builder

WORKDIR /app

# Copy root package.json
COPY package.json ./
COPY apps/client/package.json ./apps/client/

# Install dependencies
RUN bun install

# Copy client source and Caddyfile
COPY apps/client ./apps/client

# Build the app
RUN cd apps/client && bun run build

# Production stage with Caddy
FROM caddy:2-alpine

# Copy built assets
COPY --from=builder /app/apps/client/dist /usr/share/caddy

# Copy Caddyfile from builder stage
COPY --from=builder /app/apps/client/Caddyfile /etc/caddy/Caddyfile

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
