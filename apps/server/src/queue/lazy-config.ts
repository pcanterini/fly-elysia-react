import { Queue, QueueEvents } from 'bullmq';

// Queue names as constants for type safety
export const QUEUE_NAMES = {
  EXAMPLE: 'example-jobs',
  EMAIL: 'email-jobs', // Future: email queue
  REPORT: 'report-jobs', // Future: report generation
} as const;

// Get Redis connection configuration
const getRedisConfig = () => {
  // Also check for local Redis configuration
  const redisUrl = process.env.REDIS_URL || 
    (process.env.REDIS_HOST && process.env.REDIS_PORT ? 
      `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}` : null);
  
  if (!redisUrl) {
    console.log('[Redis] No Redis configuration found (REDIS_URL or REDIS_HOST/PORT)');
    return null;
  }
  
  console.log('[Redis] Using URL:', redisUrl.replace(/:[^:@]*@/, ':****@'));
  
  // Check if we're running on Fly.io
  const isOnFly = !!process.env.FLY_APP_NAME;
  const isUpstash = redisUrl.includes('upstash.io');
  
  if (isOnFly) {
    console.log('[Redis] Running on Fly.io, FLY_APP_NAME:', process.env.FLY_APP_NAME);
  }
  if (isUpstash) {
    console.log('[Redis] Upstash URL detected, using IPv6:', isOnFly);
  }
  
  // Return configuration object for BullMQ
  return {
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
    // Use IPv6 on Fly.io for Upstash, IPv4 elsewhere
    family: (isOnFly && isUpstash) ? 6 : 4,
    connectTimeout: 10000,
    connection: {
      host: undefined,
      port: undefined,
      password: undefined,
      url: redisUrl,
    },
    retryStrategy: (times: number) => {
      if (times > 10) {
        console.error('[Redis] Connection failed after 10 attempts');
        // Keep retrying slowly in production
        if (process.env.NODE_ENV === 'production') {
          return 5000; // Retry every 5 seconds
        }
        return null;
      }
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  };
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
  
  const redisConfig = getRedisConfig();
  
  if (!redisConfig) {
    console.log('[Queue] No Redis configuration found, queues disabled');
    initializationFailed = true;
    return { queue: null, events: null };
  }
  
  try {
    console.log('[Queue] Initializing queues...');
    
    // Parse Redis URL to get connection details
    const redisUrl = redisConfig.connection.url;
    const url = new URL(redisUrl);
    
    // Create connection options for BullMQ
    const connectionOpts = {
      host: url.hostname,
      port: parseInt(url.port || '6379'),
      password: url.password || undefined,
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
      family: redisConfig.family,
      connectTimeout: redisConfig.connectTimeout,
      retryStrategy: redisConfig.retryStrategy,
    };
    
    exampleQueue = new Queue(QUEUE_NAMES.EXAMPLE, {
      connection: connectionOpts,
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
      connection: { ...connectionOpts }, // Create a separate connection for events
    });
    
    // Add event listeners
    exampleQueue.on('error', (error) => {
      console.error('[Queue] Error:', error);
    });
    
    exampleQueueEvents.on('error', (error) => {
      console.error('[QueueEvents] Error:', error);
    });
    
    initialized = true;
    console.log('[Queue] Queues initialized successfully - queue created:', !!exampleQueue, 'events created:', !!exampleQueueEvents);
    return { queue: exampleQueue, events: exampleQueueEvents };
  } catch (error) {
    console.error('[Queue] Failed to initialize queues:', error);
    initializationFailed = true;
    return { queue: null, events: null };
  }
};

export const getQueue = () => {
  if (!initialized && !initializationFailed) {
    console.log('[getQueue] Calling initializeQueues...');
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