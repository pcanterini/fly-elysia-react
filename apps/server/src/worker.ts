import { startExampleWorker } from './queue/workers/example.worker';

console.log('🚀 Starting worker process...');

// Check if Redis is configured
if (!process.env.REDIS_URL) {
  console.error('❌ Worker cannot start: REDIS_URL not configured');
  console.log('Worker process will exit');
  process.exit(1);
}

// Start the worker
const worker = startExampleWorker();

// Handle graceful shutdown
const shutdown = async () => {
  console.log('Worker shutting down gracefully...');
  await worker?.close();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Keep the process alive
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception in worker:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection in worker at:', promise, 'reason:', reason);
});

console.log('✅ Worker process ready');