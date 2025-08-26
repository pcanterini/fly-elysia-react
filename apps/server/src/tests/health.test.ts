import { describe, it, expect, beforeAll } from 'bun:test';
import { Elysia } from 'elysia';
import { healthController } from '../features/health/controller';
import { securityMiddleware } from '../middleware/security';
import { errorMiddleware } from '../middleware/error';
import { testUtils } from './setup';

// Create test app
const testApp = new Elysia()
  .use(errorMiddleware)
  .use(securityMiddleware)
  .group('/api/v1', (app) => app.use(healthController));

describe('Health Controller', () => {
  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await testApp
        .handle(testUtils.createRequest('http://localhost/api/v1/health'))
        .then(res => res.json());

      testUtils.assertApiResponse(response, true);
      expect(response.data).toHaveProperty('status', 'ok');
      expect(response.data).toHaveProperty('message');
      expect(response.data).toHaveProperty('timestamp');
      expect(response.data).toHaveProperty('version');
      expect(response.data).toHaveProperty('environment');
    });

    it('should return valid timestamp format', async () => {
      const response = await testApp
        .handle(testUtils.createRequest('http://localhost/api/v1/health'))
        .then(res => res.json());

      const timestamp = new Date(response.data.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });
  });

  describe('GET /api/v1/health/detailed', () => {
    it('should return detailed health status', async () => {
      const response = await testApp
        .handle(testUtils.createRequest('http://localhost/api/v1/health/detailed'))
        .then(res => res.json());

      testUtils.assertApiResponse(response, true);
      expect(response.data).toHaveProperty('status', 'ok');
      expect(response.data).toHaveProperty('database');
      expect(response.data).toHaveProperty('uptime');
      expect(response.data.database).toHaveProperty('status');
    });

    it('should include database connectivity info', async () => {
      const response = await testApp
        .handle(testUtils.createRequest('http://localhost/api/v1/health/detailed'))
        .then(res => res.json());

      expect(response.data.database.status).toMatch(/connected|disconnected/);
      
      if (response.data.database.status === 'connected') {
        expect(response.data.database).toHaveProperty('latency');
        expect(typeof response.data.database.latency).toBe('number');
      }
    });

    it('should include uptime information', async () => {
      const response = await testApp
        .handle(testUtils.createRequest('http://localhost/api/v1/health/detailed'))
        .then(res => res.json());

      expect(typeof response.data.uptime).toBe('number');
      expect(response.data.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error handling', () => {
    it('should handle invalid routes gracefully', async () => {
      const response = await testApp.handle(
        testUtils.createRequest('http://localhost/api/v1/health/invalid')
      );

      expect(response.status).toBe(404);
    });
  });
});

// Performance tests
describe('Health Controller Performance', () => {
  it('should respond to basic health check quickly', async () => {
    const startTime = Date.now();
    
    const response = await testApp.handle(
      testUtils.createRequest('http://localhost/api/v1/health')
    );
    
    const duration = Date.now() - startTime;
    
    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(100); // Should respond within 100ms
  });

  it('should handle concurrent requests', async () => {
    const requests = Array(10).fill(null).map(() =>
      testApp.handle(testUtils.createRequest('http://localhost/api/v1/health'))
    );

    const responses = await Promise.all(requests);
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});