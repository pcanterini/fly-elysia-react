import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';

// Queue names - must match the ones in lazy-config
const QUEUE_NAMES = {
  EXAMPLE: 'example-jobs',
} as const;

// Define the job data type for type safety
interface ExampleJobData {
  timestamp?: number;
  message?: string;
  [key: string]: any;
}

// Create Redis connection for worker (only when called)
const createRedisConnection = () => {
  if (!process.env.REDIS_URL) {
    return null;
  }
  
  try {
    const redisUrl = process.env.REDIS_URL;
    const isOnFly = !!process.env.FLY_APP_NAME;
    const isUpstash = redisUrl.includes('upstash.io');
    
    if (isOnFly) {
      console.log('[Worker] Running on Fly.io, FLY_APP_NAME:', process.env.FLY_APP_NAME);
    }
    
    // Parse URL to extract password if present
    const url = new URL(redisUrl);
    
    return new Redis({
      host: url.hostname,
      port: parseInt(url.port || '6379'),
      password: url.password ? decodeURIComponent(url.password) : undefined,
      username: url.username || undefined,
      maxRetriesPerRequest: null,
      enableOfflineQueue: true,
      // Use IPv6 on Fly.io for Upstash
      family: (isOnFly && isUpstash) ? 6 : 4,
      connectTimeout: 10000,
      retryStrategy: (times: number) => {
        if (times > 10) {
          console.error('[Worker] Redis connection failed after 10 attempts');
          if (process.env.NODE_ENV === 'production') {
            return 5000; // Keep retrying in production
          }
          return null;
        }
        return Math.min(times * 50, 2000);
      },
      lazyConnect: false,
      enableReadyCheck: true
    });
  } catch (error) {
    console.error('[Worker] Failed to create Redis connection:', error);
    return null;
  }
};

// Create the worker that processes example jobs
export const createExampleWorker = () => {
  const connection = createRedisConnection();
  
  if (!connection) {
    console.warn('[Worker] Redis connection not available, worker will not start');
    return null;
  }
  
  const worker = new Worker<ExampleJobData>(
    QUEUE_NAMES.EXAMPLE,
    async (job: Job<ExampleJobData>) => {
      console.log(`[Worker] Processing job ${job.id} - ${job.name}`);
      
      try {
        // Update progress to 0%
        await job.updateProgress(0);
        await job.log('Starting job processing...');
        
        // Simulate work with 5 second delay, updating progress every second
        for (let i = 1; i <= 5; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const progress = i * 20; // 20%, 40%, 60%, 80%, 100%
          await job.updateProgress(progress);
          await job.log(`Progress: ${progress}%`);
        }
        
        // Return the result
        const result = {
          message: `Job ${job.id} completed successfully!`,
          processedAt: new Date().toISOString(),
          inputData: job.data,
          processingTime: '5 seconds',
        };
        
        console.log(`[Worker] Job ${job.id} completed`);
        return result;
        
      } catch (error) {
        console.error(`[Worker] Job ${job.id} failed:`, error);
        throw error;
      }
    },
    {
      connection: connection,
      concurrency: 5, // Process up to 5 jobs concurrently
      autorun: true, // Start processing immediately
      stalledInterval: 30000, // Check for stalled jobs every 30s
      maxStalledCount: 3, // Max number of times a job can be stalled
    }
  );

  // Event listeners for monitoring
  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} has completed`);
  });

  worker.on('failed', (job, err) => {
    if (job) {
      console.error(`[Worker] Job ${job.id} has failed:`, err.message);
    }
  });

  worker.on('active', (job) => {
    console.log(`[Worker] Job ${job.id} is now active`);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Worker error:', err);
  });

  worker.on('stalled', (jobId) => {
    console.warn(`[Worker] Job ${jobId} has stalled`);
  });

  return worker;
};

// Singleton instance of the worker
let workerInstance: Worker | null = null;

export const startExampleWorker = () => {
  if (!workerInstance) {
    const worker = createExampleWorker();
    if (worker) {
      workerInstance = worker;
      console.log('[Worker] Example worker started');
    } else {
      console.warn('[Worker] Example worker could not start - Redis not available');
    }
  }
  return workerInstance;
};

export const stopExampleWorker = async () => {
  if (workerInstance) {
    await workerInstance.close();
    workerInstance = null;
    console.log('[Worker] Example worker stopped');
  }
};