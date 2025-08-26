import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create a postgres connection
export const connection = postgres(connectionString);

// Create Drizzle database instance
export const db = drizzle(connection, { schema });

export { schema };
export * from './schema';