/**
 * Environment variable validation and parsing utilities
 */

export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
}

/**
 * Validate and parse environment variables
 */
export function validateEnv(): EnvConfig {
  const requiredVars = ['DATABASE_URL', 'BETTER_AUTH_SECRET'];
  const missing: string[] = [];

  for (const variable of requiredVars) {
    if (!process.env[variable]) {
      missing.push(variable);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment configuration.'
    );
  }

  const nodeEnv = process.env.NODE_ENV as EnvConfig['NODE_ENV'];
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    console.warn(`Warning: NODE_ENV "${nodeEnv}" is not a recognized value. Defaulting to "development".`);
  }

  const port = parseInt(process.env.PORT || '3001', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${process.env.PORT}. Must be a number between 1 and 65535.`);
  }

  return {
    NODE_ENV: nodeEnv || 'development',
    PORT: port,
    DATABASE_URL: process.env.DATABASE_URL!,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL
  };
}

/**
 * Get environment-specific configuration
 */
export function getConfig() {
  const env = validateEnv();
  const isProduction = env.NODE_ENV === 'production';
  const isDevelopment = env.NODE_ENV === 'development';
  const isTest = env.NODE_ENV === 'test';

  return {
    ...env,
    isProduction,
    isDevelopment,
    isTest,
    
    // Database settings
    database: {
      url: env.DATABASE_URL,
      ssl: isProduction,
      maxConnections: isProduction ? 20 : 5,
      logQueries: isDevelopment
    },
    
    // Auth settings
    auth: {
      secret: env.BETTER_AUTH_SECRET,
      baseURL: env.BETTER_AUTH_URL || `http://localhost:${env.PORT}`,
      requireEmailVerification: isProduction,
      useSecureCookies: isProduction
    },
    
    // CORS settings
    cors: {
      allowedOrigins: [
        'https://bun-app-client.fly.dev',
        ...(!isProduction ? [
          'http://localhost',
          'http://localhost:80',
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:5174',
          'http://localhost:4173',
          'http://127.0.0.1:5173',
          'http://127.0.0.1:5174',
          'http://127.0.0.1:3000',
          'http://127.0.0.1:4173'
        ] : [])
      ]
    }
  };
}