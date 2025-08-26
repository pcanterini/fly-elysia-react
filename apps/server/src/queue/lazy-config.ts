import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Queue names as constants for type safety
export const QUEUE_NAMES = {
  EXAMPLE: 'example-jobs',
  EMAIL: 'email-jobs', // Future: email queue
  REPORT: 'report-jobs', // Future: report generation
} as const;

// Create Redis connection for queue operations (only when called)
const createRedisConnection = () => {
  if (!process.env.REDIS_URL) {
    console.log('[Redis] No REDIS_URL configured');
    return null;
  }
  
  const url = process.env.REDIS_URL;
  console.log('[Redis] Connecting with URL:', url.replace(/:[^:@]*@/, ':****@'));
  
  try {
    const connection = new Redis(url, {
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
      family: 4,
      connectTimeout: 10000,
      retryStrategy: (times: number) => {
        if (times > 10) {
          console.error('[Redis] Connection failed after 10 attempts');
          return null;
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true
    });
    
    connection.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });
    
    connection.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });
    
    return connection;
  } catch (error) {
    console.error('[Redis] Failed to create connection:', error);
    return null;
  }
};

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