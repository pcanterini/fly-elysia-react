import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Create Redis connection for queue operations
export const createRedisConnection = () => {
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null,
    // Enable offline queue to handle connection issues
    enableOfflineQueue: true,
    // Reconnect strategy
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });
};

// Create connection instances
export const redisConnection = createRedisConnection();

// Queue names as constants for type safety
export const QUEUE_NAMES = {
  EXAMPLE: 'example-jobs',
  EMAIL: 'email-jobs', // Future: email queue
  REPORT: 'report-jobs', // Future: report generation
} as const;

// Create queues with shared configuration
export const exampleQueue = new Queue(QUEUE_NAMES.EXAMPLE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
      age: 24 * 3600, // Remove jobs older than 24 hours
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  },
});

// Queue events for monitoring
export const exampleQueueEvents = new QueueEvents(QUEUE_NAMES.EXAMPLE, {
  connection: createRedisConnection(), // Separate connection for events
});

// Graceful shutdown
export const closeQueues = async () => {
  try {
    await exampleQueue.close();
    await exampleQueueEvents.close();
    redisConnection.disconnect();
    console.log('Queue connections closed gracefully');
  } catch (error) {
    console.error('Error closing queue connections:', error);
  }
};

// Handle process termination
process.on('SIGINT', closeQueues);
process.on('SIGTERM', closeQueues);