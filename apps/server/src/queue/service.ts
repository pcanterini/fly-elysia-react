import { Job as BullJob, JobState } from 'bullmq';
import { exampleQueue, exampleQueueEvents } from './config';
import type { 
  Job, 
  CreateJobRequest, 
  JobListResponse, 
  QueueStats,
  JobAction,
  JobActionResponse,
  JobStatus 
} from '@my-app/shared';

export class QueueService {
  /**
   * Create a new job
   */
  async createJob(data: CreateJobRequest): Promise<Job> {
    const bullJob = await exampleQueue.add(
      data.name || 'example-job',
      data.data || {},
      {
        delay: data.delay,
        priority: data.priority,
      }
    );
    
    return this.formatJob(bullJob);
  }

  /**
   * Get a single job by ID
   */
  async getJob(id: string): Promise<Job | null> {
    const job = await exampleQueue.getJob(id);
    return job ? this.formatJob(job) : null;
  }

  /**
   * Get list of jobs with pagination
   */
  async getJobs(
    page = 1,
    pageSize = 20,
    states?: JobState[]
  ): Promise<JobListResponse> {
    const statesToFetch = states || ['waiting', 'active', 'completed', 'failed', 'delayed', 'paused'];
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;
    
    // Fetch jobs from all requested states
    const jobPromises = statesToFetch.map(state => 
      exampleQueue.getJobs(state as any, start, end)
    );
    
    const jobArrays = await Promise.all(jobPromises);
    const allJobs = jobArrays.flat();
    
    // Sort by timestamp (newest first)
    allJobs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    
    // Take only the requested page size
    const paginatedJobs = allJobs.slice(0, pageSize);
    
    // Get total count
    const counts = await exampleQueue.getJobCounts(...statesToFetch as any);
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    
    return {
      jobs: paginatedJobs.map(job => this.formatJob(job)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats> {
    const counts = await exampleQueue.getJobCounts(
      'waiting',
      'active', 
      'completed',
      'failed',
      'delayed',
      'paused'
    );
    
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
      delayed: counts.delayed || 0,
      paused: counts.paused || 0,
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
    };
  }

  /**
   * Perform action on a job (retry, remove, promote)
   */
  async performJobAction(jobId: string, action: JobAction['action']): Promise<JobActionResponse> {
    const job = await exampleQueue.getJob(jobId);
    
    if (!job) {
      return {
        success: false,
        message: 'Job not found',
      };
    }

    try {
      switch (action) {
        case 'retry':
          // Only retry failed jobs
          const state = await job.getState();
          if (state !== 'failed') {
            return {
              success: false,
              message: `Cannot retry job in ${state} state`,
            };
          }
          await job.retry();
          return {
            success: true,
            message: 'Job retried successfully',
            job: this.formatJob(job),
          };

        case 'remove':
          await job.remove();
          return {
            success: true,
            message: 'Job removed successfully',
          };

        case 'promote':
          // Only promote delayed jobs
          const currentState = await job.getState();
          if (currentState !== 'delayed') {
            return {
              success: false,
              message: `Cannot promote job in ${currentState} state`,
            };
          }
          await job.promote();
          return {
            success: true,
            message: 'Job promoted successfully',
            job: this.formatJob(job),
          };

        default:
          return {
            success: false,
            message: `Unknown action: ${action}`,
          };
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Action failed',
      };
    }
  }

  /**
   * Clean completed/failed jobs
   */
  async cleanJobs(grace: number = 0, limit: number = 100, status: 'completed' | 'failed' = 'completed'): Promise<string[]> {
    return await exampleQueue.clean(grace, limit, status);
  }

  /**
   * Pause/Resume the queue
   */
  async pauseQueue(): Promise<void> {
    await exampleQueue.pause();
  }

  async resumeQueue(): Promise<void> {
    await exampleQueue.resume();
  }

  /**
   * Get queue events for real-time monitoring
   */
  getQueueEvents() {
    return exampleQueueEvents;
  }

  /**
   * Format BullMQ job to our Job interface
   */
  private formatJob(bullJob: BullJob): Job {
    const state = bullJob.failedReason ? 'failed' : 
                  bullJob.finishedOn ? 'completed' :
                  bullJob.processedOn ? 'active' :
                  bullJob.delay ? 'delayed' : 'waiting';

    return {
      id: bullJob.id || '',
      name: bullJob.name,
      status: state as JobStatus,
      progress: typeof bullJob.progress === 'number' ? bullJob.progress : 0,
      data: bullJob.data || {},
      result: bullJob.returnvalue,
      error: bullJob.failedReason,
      createdAt: new Date(bullJob.timestamp || Date.now()).toISOString(),
      updatedAt: new Date(bullJob.processedOn || bullJob.timestamp || Date.now()).toISOString(),
      processedOn: bullJob.processedOn ? new Date(bullJob.processedOn).toISOString() : undefined,
      finishedOn: bullJob.finishedOn ? new Date(bullJob.finishedOn).toISOString() : undefined,
      attempts: bullJob.attemptsMade,
      maxAttempts: bullJob.opts.attempts || 3,
    };
  }
}

// Export singleton instance
export const queueService = new QueueService();