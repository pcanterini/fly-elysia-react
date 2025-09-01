import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

// Load environment variables from .env (and .env.local if it exists)
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@localhost:5432/fly_elysia_react",
  },
  verbose: true,
  strict: true,
});
