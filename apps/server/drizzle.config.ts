import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// Only load environment variables if DATABASE_URL is not already set
// This allows the db-prod.js script to override DATABASE_URL
if (!process.env.DATABASE_URL) {
  // Load environment variables from .env (and .env.local if it exists)
  dotenv.config({ path: ".env" });
  dotenv.config({ path: ".env.local" });
}

// Get the database URL
const databaseUrl = process.env.DATABASE_URL || 
  "postgresql://postgres:postgres@localhost:5432/fly_elysia_react";

// Debug logging to verify which database is being used
if (process.env.DATABASE_URL) {
  const maskedUrl = databaseUrl.replace(/(?<=:\/\/)([^:]+):([^@]+)@/, '$1:****@');
  console.log(`[Drizzle Config] Using DATABASE_URL: ${maskedUrl}`);
} else {
  console.log('[Drizzle Config] Using default local database URL');
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});
