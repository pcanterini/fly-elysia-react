FROM oven/bun:1

WORKDIR /app

# Copy root package.json and lockfile
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/

# Install dependencies
RUN bun install

# Copy server source
COPY apps/server ./apps/server

# Build the server
RUN bun --cwd apps/server run build

WORKDIR /app/apps/server

EXPOSE 3001

CMD ["bun", "start"]
