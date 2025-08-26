import { db } from '../../db';
import { ApiError } from '../../types/api';

export abstract class HealthService {
  private static readonly version = process.env.npm_package_version || '1.0.0';
  private static readonly environment = process.env.NODE_ENV || 'development';
  
  /**
   * Basic health check
   */
  static async checkHealth(clientIP?: string): Promise<{
    status: 'ok';
    message: string;
    timestamp: string;
    version?: string;
    environment?: string;
  }> {
    return {
      status: 'ok' as const,
      message: 'Server is running!',
      timestamp: new Date().toISOString(),
      version: this.version,
      environment: this.environment
    };
  }

  /**
   * Detailed health check including database connectivity
   */
  static async checkDetailedHealth(clientIP?: string): Promise<{
    status: 'ok';
    message: string;
    timestamp: string;
    version?: string;
    environment?: string;
    database?: {
      status: 'connected' | 'disconnected';
      latency?: number;
    };
    uptime?: number;
  }> {
    const startTime = Date.now();
    let databaseStatus: { status: 'connected' | 'disconnected'; latency?: number } = {
      status: 'disconnected'
    };

    try {
      // Simple database connectivity test
      await db.execute('SELECT 1');
      const latency = Date.now() - startTime;
      databaseStatus = {
        status: 'connected',
        latency
      };
    } catch (error) {
      console.error('Database health check failed:', error);
      // Don't throw error for health check, just report status
    }

    return {
      status: 'ok' as const,
      message: 'Server is running with detailed status!',
      timestamp: new Date().toISOString(),
      version: this.version,
      environment: this.environment,
      database: databaseStatus,
      uptime: process.uptime()
    };
  }

  /**
   * Validate system dependencies
   */
  static async validateDependencies(): Promise<void> {
    try {
      // Test database connection
      await db.execute('SELECT 1');
    } catch (error) {
      throw new ApiError(
        'Database connection failed during startup',
        503,
        'DATABASE_CONNECTION_FAILED'
      );
    }

    // Add other dependency checks here (Redis, external APIs, etc.)
  }
}