import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const isProduction = process.env.NODE_ENV === 'production';

// Configure postgres connection with production-ready settings
const connection = postgres(connectionString, {
  // Connection pool settings
  max: isProduction ? 20 : 5,           // Max connections in pool
  idle_timeout: 20,                      // Close idle connections after 20 seconds
  connect_timeout: 10,                   // Connection timeout in seconds
  
  // SSL configuration for production
  ssl: isProduction ? 'require' : false,
  
  // Query and connection settings
  prepare: true,                         // Use prepared statements for performance
  transform: {
    // Transform column names to camelCase
    column: {
      to: postgres.toCamel,
      from: postgres.fromCamel,
    },
  },
  
  // Development debugging
  debug: !isProduction ? (connection, query, params) => {
    console.log('[DB Query]:', query);
    if (params && params.length) {
      console.log('[DB Params]:', params);
    }
  } : undefined,
  
  // Error handling
  onnotice: isProduction 
    ? undefined 
    : (notice) => console.log('[DB Notice]:', notice),
});

// Create Drizzle database instance with enhanced configuration
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