import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const isProduction = process.env.NODE_ENV === 'production';
const isNeon = connectionString.includes('neon.tech');

// Configure connection based on database type
const connection = postgres(connectionString, {
  // Connection pool settings
  max: isNeon ? 5 : 5,                    // Small pool per server instance
  idle_timeout: isNeon ? 10 : 20,         // Quick cleanup for Neon (10 seconds)
  connect_timeout: 30,                    // Generous for cold starts
  max_lifetime: isNeon ? 3600 : undefined, // Refresh Neon connections hourly
  
  // SSL configuration
  ssl: isNeon ? 'require' : (connectionString.includes('sslmode=require') ? 'require' : false),
  
  // Neon-specific: prepare statements can cause issues
  prepare: !isNeon,
  
  // Keep connection alive for Neon
  keep_alive: isNeon ? 10 : null, // 10 seconds interval for keep-alive
  
  // Don't transform column names as it can cause issues
  transform: undefined,
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
    const result = await connection`SELECT 1 as connected`;
    return result[0]?.connected === 1;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

// Only handle graceful shutdown for non-Neon databases
// Neon handles connection lifecycle differently
if (!isNeon) {
  process.on('SIGINT', closeDatabase);
  process.on('SIGTERM', closeDatabase);
}

export { schema };
export * from './schema';