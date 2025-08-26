/**
 * Test setup and utilities for Elysia API testing
 */

import { beforeAll, afterAll } from 'bun:test';
import { testDatabaseConnection, closeDatabase } from '../db';
import { logger } from '../utils/logger';

// Mock environment for testing
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.BETTER_AUTH_SECRET = 'test-secret-key-for-testing-only';
process.env.BETTER_AUTH_URL = 'http://localhost:3002';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/fly_elysia_react_test';
}

// Test utilities
export const testUtils = {
  /**
   * Create a test request with proper headers
   */
  createRequest: (url: string, options: RequestInit = {}): Request => {
    return new Request(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
  },

  /**
   * Create authenticated request (mock session)
   */
  createAuthenticatedRequest: (url: string, userId: string, options: RequestInit = {}): Request => {
    return new Request(url, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer mock-token-${userId}`,
        ...options.headers
      },
      ...options
    });
  },

  /**
   * Parse response body as JSON
   */
  parseResponse: async (response: Response) => {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  },

  /**
   * Assert response structure
   */
  assertApiResponse: (
    response: any, 
    expectedSuccess: boolean = true
  ): void => {
    expect(response).toHaveProperty('success');
    expect(response).toHaveProperty('timestamp');
    expect(response.success).toBe(expectedSuccess);
    
    if (expectedSuccess) {
      expect(response).toHaveProperty('data');
    } else {
      expect(response).toHaveProperty('error');
    }
  }
};

// Global test setup
beforeAll(async () => {
  logger.info('Setting up test environment');
  
  // Test database connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    throw new Error('Failed to connect to test database');
  }
  
  logger.info('Test environment ready');
});

// Global test teardown
afterAll(async () => {
  logger.info('Cleaning up test environment');
  
  // Close database connections
  await closeDatabase();
  
  logger.info('Test cleanup completed');
});

export default testUtils;