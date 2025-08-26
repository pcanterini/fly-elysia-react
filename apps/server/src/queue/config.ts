import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

// Create Redis connection for queue operations  
export const createRedisConnection = () => {
  // Use REDIS_URL if available (production), otherwise fall back to host/port (development)
  if (process.env.REDIS_URL) {
    const url = process.env.REDIS_URL;
    console.log('Connecting to Redis with URL:', url.replace(/:[^:@]*@/, ':****@'));
    
    try {
      // Try direct connection with URL string first (ioredis handles parsing)
      const connection = new Redis(url, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: true,
        family: 4, // Force IPv4
        connectTimeout: 10000,
        retryStrategy: (times: number) => {
          const delay = Math.min(times * 50, 2000);
          console.log(`Redis retry attempt ${times}, waiting ${delay}ms`);
          if (times > 10) {
            console.error('Redis connection failed after 10 attempts');
            return null; // Stop retrying after 10 attempts
          }
          return delay;
        },
        lazyConnect: true,
        // DNS resolution options
        lookup: (hostname, options, callback) => {
          console.log(`Resolving hostname: ${hostname}`);
          // Use default DNS lookup
          require('dns').lookup(hostname, options, callback);
        }
      });
      
      // Add error handler to prevent unhandled rejections
      connection.on('error', (err) => {
        console.error('Redis connection error:', err.message);
        if (err.message.includes('ENOTFOUND')) {
          console.error(`Cannot resolve hostname. Please check if ${url.split('@')[1]?.split(':')[0]} is accessible from this network.`);
        }
      });
      
      connection.on('connect', () => {
        console.log('Redis connected successfully');
      });
      
      connection.on('ready', () => {
        console.log('Redis connection ready');
      });
      
      return connection;
    } catch (error) {
      console.error('Failed to create Redis connection:', error);
      throw error;
    }
  }
  
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

// Create connection instances with error handling
let redisConnectionInstance: Redis | null = null;
let connectionAttempted = false;
let connectionFailed = false;

export const getRedisConnection = () => {
  if (!connectionAttempted && process.env.REDIS_URL) {
    connectionAttempted = true;
    try {
      redisConnectionInstance = createRedisConnection();
    } catch (error) {
      console.error('Failed to initialize Redis connection:', error);
      connectionFailed = true;
    }
  }
  return redisConnectionInstance;
};

// Initialize connection only if REDIS_URL is set
export const redisConnection = process.env.REDIS_URL ? getRedisConnection() : null;

// Queue names as constants for type safety
export const QUEUE_NAMES = {
  EXAMPLE: 'example-jobs',
  EMAIL: 'email-jobs', // Future: email queue
  REPORT: 'report-jobs', // Future: report generation
} as const;

// Create queues with shared configuration (only if Redis is available)
export const exampleQueue = redisConnection ? new Queue(QUEUE_NAMES.EXAMPLE, {
  connection: redisConnection as Redis,
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
}) : null;

// Queue events for monitoring (only if Redis is available)
export const exampleQueueEvents = redisConnection ? new QueueEvents(QUEUE_NAMES.EXAMPLE, {
  connection: createRedisConnection(), // Separate connection for events
}) : null;

// Graceful shutdown
export const closeQueues = async () => {
  try {
    if (exampleQueue) await exampleQueue.close();
    if (exampleQueueEvents) await exampleQueueEvents.close();
    if (redisConnection) redisConnection.disconnect();
    console.log('Queue connections closed gracefully');
  } catch (error) {
    console.error('Error closing queue connections:', error);
  }
};

// Handle process termination
process.on('SIGINT', closeQueues);
process.on('SIGTERM', closeQueues);