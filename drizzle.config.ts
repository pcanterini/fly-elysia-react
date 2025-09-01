import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './apps/server/src/db/schema.ts',
  out: './apps/server/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/your_database_name',
  },
  verbose: true,
  strict: true,
});