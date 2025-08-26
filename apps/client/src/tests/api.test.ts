import { describe, it, expect } from 'vitest';
import { ApiClientError } from '../lib/api';

describe('API Client', () => {
  describe('ApiClientError', () => {
    it('should create error with all properties', () => {
      const error = new ApiClientError('Test error', 404, 'NOT_FOUND', { field: 'test' });
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.details).toEqual({ field: 'test' });
      expect(error.name).toBe('ApiClientError');
    });

    it('should work without optional details', () => {
      const error = new ApiClientError('Server error', 500, 'SERVER_ERROR');
      
      expect(error.message).toBe('Server error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('SERVER_ERROR');
      expect(error.details).toBeUndefined();
    });
  });
});