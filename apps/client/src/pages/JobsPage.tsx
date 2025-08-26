import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { FiRefreshCw, FiTrash2, FiPlay, FiClock, FiCheckCircle, FiXCircle, FiPauseCircle, FiArrowLeft } from 'react-icons/fi';
import type { Job, JobStatus } from '@my-app/shared';

export function JobsPage() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<'jobs' | 'stats'>('jobs');

  // Fetch jobs with polling
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => apiClient.jobs.list(),
    refetchInterval: 2000, // Poll every 2 seconds
  });

  // Fetch queue statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['queue-stats'],
    queryFn: () => apiClient.jobs.stats(),
    refetchInterval: 5000, // Poll every 5 seconds
    enabled: selectedTab === 'stats',
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: () => apiClient.jobs.create({ 
      name: 'example-job',
      data: { 
        timestamp: Date.now(),
        message: 'Test job created from UI'
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
  });

  // Retry job mutation
  const retryJobMutation = useMutation({
    mutationFn: (jobId: string) => apiClient.jobs.action(jobId, 'retry'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  // Remove job mutation
  const removeJobMutation = useMutation({
    mutationFn: (jobId: string) => apiClient.jobs.action(jobId, 'remove'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['queue-stats'] });
    },
  });

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="text-green-500" />;
      case 'failed':
        return <FiXCircle className="text-red-500" />;
      case 'active':
        return <FiPlay className="text-blue-500" />;
      case 'delayed':
        return <FiClock className="text-yellow-500" />;
      case 'paused':
        return <FiPauseCircle className="text-gray-500" />;
      default:
        return <FiClock className="text-gray-400" />;
    }
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-500/10';
      case 'failed': return 'text-red-500 bg-red-500/10';
      case 'active': return 'text-blue-500 bg-blue-500/10';
      case 'delayed': return 'text-yellow-500 bg-yellow-500/10';
      case 'paused': return 'text-gray-500 bg-gray-500/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getProgressBar = (progress: number, status: JobStatus) => {
    if (status !== 'active') return null;
    return (
      <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
          style={{ width: `${progress}%` }}
        />
        <p className="text-xs text-gray-400 mt-1">{progress}% complete</p>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const calculateDuration = (job: Job) => {
    if (!job.finishedOn || !job.processedOn) return null;
    const duration = new Date(job.finishedOn).getTime() - new Date(job.processedOn).getTime();
    return `${(duration / 1000).toFixed(1)}s`;
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Job Queue Management</h1>
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
            >
              <FiArrowLeft /> Back to Dashboard
            </Link>
          </div>
          <p className="text-gray-400">Monitor and manage background jobs</p>
        </header>

        {/* Action Bar */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => createJobMutation.mutate()}
            disabled={createJobMutation.isPending}
            className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {createJobMutation.isPending ? 'Creating...' : 'Create Test Job (5s delay)'}
          </button>

          {/* Tab Switcher */}
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedTab('jobs')}
              className={`px-4 py-2 rounded ${
                selectedTab === 'jobs' 
                  ? 'bg-white text-black' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Jobs
            </button>
            <button
              onClick={() => setSelectedTab('stats')}
              className={`px-4 py-2 rounded ${
                selectedTab === 'stats' 
                  ? 'bg-white text-black' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Statistics
            </button>
          </div>
        </div>

        {/* Content Area */}
        {selectedTab === 'jobs' ? (
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Jobs History</h2>
            
            {jobsLoading ? (
              <p className="text-gray-400">Loading jobs...</p>
            ) : (
              <div className="space-y-4">
                {jobsData?.jobs?.map((job) => (
                  <div key={job.id} className="bg-black border border-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(job.status)}
                          <p className="text-white font-medium">Job #{job.id}</p>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(job.status)}`}>
                            {job.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-400 space-y-1">
                          <p>Name: {job.name}</p>
                          <p>Created: {formatDate(job.createdAt)}</p>
                          {job.processedOn && <p>Started: {formatDate(job.processedOn)}</p>}
                          {job.finishedOn && (
                            <p>
                              Finished: {formatDate(job.finishedOn)}
                              {calculateDuration(job) && ` (Duration: ${calculateDuration(job)})`}
                            </p>
                          )}
                          {job.attempts > 0 && (
                            <p>Attempts: {job.attempts}/{job.maxAttempts}</p>
                          )}
                        </div>
                        
                        {getProgressBar(job.progress, job.status)}
                        
                        {job.data && Object.keys(job.data).length > 0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                              Job Data
                            </summary>
                            <pre className="mt-2 text-xs text-gray-500 bg-gray-900 p-2 rounded overflow-x-auto">
                              {JSON.stringify(job.data, null, 2)}
                            </pre>
                          </details>
                        )}
                        
                        {job.result && (
                          <div className="mt-2">
                            <p className="text-sm text-green-400">Result:</p>
                            <pre className="text-xs text-green-400 bg-gray-900 p-2 rounded mt-1 overflow-x-auto">
                              {JSON.stringify(job.result, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {job.error && (
                          <div className="mt-2">
                            <p className="text-sm text-red-400">Error:</p>
                            <p className="text-xs text-red-400 bg-red-900/20 p-2 rounded mt-1">
                              {job.error}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Job Actions */}
                      <div className="flex gap-2 ml-4">
                        {job.status === 'failed' && (
                          <button
                            onClick={() => retryJobMutation.mutate(job.id)}
                            disabled={retryJobMutation.isPending}
                            className="p-2 text-yellow-500 hover:bg-gray-800 rounded transition-colors"
                            title="Retry Job"
                          >
                            <FiRefreshCw />
                          </button>
                        )}
                        <button
                          onClick={() => removeJobMutation.mutate(job.id)}
                          disabled={removeJobMutation.isPending}
                          className="p-2 text-red-500 hover:bg-gray-800 rounded transition-colors"
                          title="Remove Job"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {jobsData?.jobs?.length === 0 && (
                  <p className="text-gray-400 text-center py-8">
                    No jobs yet. Create one to get started!
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold mb-4">Queue Statistics</h2>
            
            {statsLoading ? (
              <p className="text-gray-400">Loading statistics...</p>
            ) : statsData ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <StatCard title="Waiting" value={statsData.waiting} color="text-gray-400" />
                <StatCard title="Active" value={statsData.active} color="text-blue-500" />
                <StatCard title="Completed" value={statsData.completed} color="text-green-500" />
                <StatCard title="Failed" value={statsData.failed} color="text-red-500" />
                <StatCard title="Delayed" value={statsData.delayed} color="text-yellow-500" />
                <StatCard title="Paused" value={statsData.paused} color="text-gray-500" />
                <StatCard title="Total" value={statsData.total} color="text-white" />
              </div>
            ) : (
              <p className="text-gray-400">Failed to load statistics</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Statistics Card Component
function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="bg-black border border-gray-800 p-4 rounded-lg">
      <p className="text-gray-400 text-sm mb-2">{title}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}