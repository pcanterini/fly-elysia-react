import { Queue, QueueEvents } from 'bullmq';
import type Redis from 'ioredis';
import { createRedisConnection, QUEUE_NAMES } from './config';

// Lazy queue initialization
let exampleQueue: Queue | null = null;
let exampleQueueEvents: QueueEvents | null = null;
let initialized = false;
let initializationFailed = false;

export const initializeQueues = () => {
  if (initialized || initializationFailed) {
    return { queue: exampleQueue, events: exampleQueueEvents };
  }
  
  if (!process.env.REDIS_URL) {
    console.log('[Queue] No REDIS_URL configured, queues disabled');
    initializationFailed = true;
    return { queue: null, events: null };
  }
  
  try {
    console.log('[Queue] Initializing queues...');
    const connection = createRedisConnection();
    
    if (!connection) {
      throw new Error('Failed to create Redis connection');
    }
    
    exampleQueue = new Queue(QUEUE_NAMES.EXAMPLE, {
      connection: connection as Redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: {
          count: 100,
          age: 24 * 3600,
        },
        removeOnFail: {
          count: 50,
        },
      },
    });
    
    exampleQueueEvents = new QueueEvents(QUEUE_NAMES.EXAMPLE, {
      connection: createRedisConnection() as Redis,
    });
    
    initialized = true;
    console.log('[Queue] Queues initialized successfully');
    return { queue: exampleQueue, events: exampleQueueEvents };
  } catch (error) {
    console.error('[Queue] Failed to initialize queues:', error);
    initializationFailed = true;
    return { queue: null, events: null };
  }
};

export const getQueue = () => {
  if (!initialized && !initializationFailed) {
    initializeQueues();
  }
  return exampleQueue;
};

export const getQueueEvents = () => {
  if (!initialized && !initializationFailed) {
    initializeQueues();
  }
  return exampleQueueEvents;
};

export const closeQueues = async () => {
  try {
    if (exampleQueue) await exampleQueue.close();
    if (exampleQueueEvents) await exampleQueueEvents.close();
    console.log('[Queue] Connections closed gracefully');
  } catch (error) {
    console.error('[Queue] Error closing connections:', error);
  }
};