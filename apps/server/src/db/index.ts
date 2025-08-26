import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const isProduction = process.env.NODE_ENV === 'production';

// Simplified connection for debugging
const connection = postgres(connectionString, {
  max: 5,
  ssl: connectionString.includes('sslmode=require') ? 'require' : false,
});

// Create Drizzle database instance
export const db = drizzle(connection, { 
  schema,
  logger: !isProduction // Enable query logging in development
});

/**
 * Graceful shutdown handler for database connections
 */
export const closeDatabase = async (): Promise<void> => {
  try {
    await connection.end();
    console.log('Database connection closed gracefully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

/**
 * Test database connectivity
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    await connection`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

// Handle graceful shutdown
process.on('SIGINT', closeDatabase);
process.on('SIGTERM', closeDatabase);

export { schema };
export * from './schema';