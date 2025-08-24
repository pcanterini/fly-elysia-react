FROM oven/bun:1

WORKDIR /app

# Copy package files for dependency installation
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/

# Install dependencies
RUN bun install

# Copy server source code
COPY apps/server ./apps/server

# Build the server
RUN cd apps/server && bun run build

WORKDIR /app/apps/server

EXPOSE 3001

CMD ["bun", "start"]
