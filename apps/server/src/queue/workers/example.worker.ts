import { Worker, Job } from 'bullmq';
import { createRedisConnection, QUEUE_NAMES } from '../config';

// Define the job data type for type safety
interface ExampleJobData {
  timestamp?: number;
  message?: string;
  [key: string]: any;
}

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
      // Worker settings for better performance and monitoring
      settings: {
        stalledInterval: 30000, // Check for stalled jobs every 30s
        maxStalledCount: 3, // Max number of times a job can be stalled
      },
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