import { Elysia } from 'elysia';
import { HealthModel } from '../../types/api';
import { HealthService } from './service';

export const healthController = new Elysia({ prefix: '/health' })
  .get('/', 
    async ({ clientIP }) => {
      const healthData = await HealthService.checkHealth(clientIP);
      return healthData;
    },
    {
      response: {
        200: HealthModel.response
      },
      detail: {
        tags: ['Health'],
        summary: 'Health Check',
        description: 'Get server health status and basic information'
      }
    }
  )
  .get('/detailed',
    async ({ clientIP }) => {
      const detailedHealth = await HealthService.checkDetailedHealth(clientIP);
      return detailedHealth;
    },
    {
      response: {
        200: HealthModel.response
      },
      detail: {
        tags: ['Health'],
        summary: 'Detailed Health Check',
        description: 'Get detailed server health including database connectivity'
      }
    }
  );