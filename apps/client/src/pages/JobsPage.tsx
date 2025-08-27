import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import type { Job, JobStatus } from '@my-app/shared';

export function JobsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'jobs' | 'stats'>('jobs');

  // Fetch jobs with polling
  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', user?.id],
    queryFn: () => apiClient.jobs.list(),
    refetchInterval: 2000, // Poll every 2 seconds
    enabled: !!user, // Only fetch when user is available
  });
  
  // Extra security: Filter jobs client-side to ensure only user's jobs are shown
  // This is a defense-in-depth measure in addition to server-side filtering
  const filteredJobs = useMemo(() => {
    if (!jobsData?.jobs || !user) return [];
    return jobsData.jobs.filter(job => job.userId === user.id);
  }, [jobsData?.jobs, user]);

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
        return <span style={{ color: 'var(--success)' }}>✓</span>;
      case 'failed':
        return <span style={{ color: 'var(--error)' }}>✗</span>;
      case 'active':
        return <span style={{ color: 'var(--primary)' }}>▶</span>;
      case 'delayed':
        return <span style={{ color: 'var(--warning)' }}>⏰</span>;
      case 'paused':
        return <span style={{ color: 'var(--muted)' }}>⏸</span>;
      default:
        return <span style={{ color: 'var(--muted)' }}>⏰</span>;
    }
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
    <div className="terminal" style={{ minHeight: '100vh', padding: '2rem' }}>
      <div className="container">
        <header className="terminal-header" style={{ marginBottom: '2rem' }}>
          <div className="terminal-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1>Job Queue Management</h1>
            <Link 
              to="/dashboard" 
              className="btn btn-default btn-ghost"
            >
              ← Back to Dashboard
            </Link>
          </div>
          <p className="terminal-prompt">Monitor and manage background jobs</p>
        </header>

        {/* Action Bar */}
        <div className="terminal-menu" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <button
            onClick={() => createJobMutation.mutate()}
            disabled={createJobMutation.isPending}
            className="btn btn-primary"
          >
            {createJobMutation.isPending ? 'Creating...' : '+ Create Test Job'}
          </button>

          {/* Tab Switcher */}
          <div className="terminal-tabs">
            <button
              onClick={() => setSelectedTab('jobs')}
              className={`btn ${
                selectedTab === 'jobs' 
                  ? 'btn-primary' 
                  : 'btn-default btn-ghost'
              }`}
            >
              Jobs
            </button>
            <button
              onClick={() => setSelectedTab('stats')}
              className={`btn ${
                selectedTab === 'stats' 
                  ? 'btn-primary' 
                  : 'btn-default btn-ghost'
              }`}
            >
              Statistics
            </button>
          </div>
        </div>

        {/* Content Area */}
        {selectedTab === 'jobs' ? (
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Jobs History</h2>
            {jobsLoading ? (
              <div className="terminal-alert">Loading jobs...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {filteredJobs.map((job) => (
                  <div key={job.id} className="terminal-card">
                      <header style={{ padding: '0.5rem 1rem', borderBottom: '1px solid var(--secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {getStatusIcon(job.status)}
                          <strong>Job #{job.id}</strong>
                          <span className={`terminal-badge ${job.status === 'completed' ? 'terminal-badge-success' : job.status === 'failed' ? 'terminal-badge-error' : job.status === 'active' ? 'terminal-badge-info' : ''}`}>
                            {job.status.toUpperCase()}
                          </span>
                        </div>
                      </header>
                      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                        
                        <div className="terminal-comment">
                          <div>Name: {job.name}</div>
                          <div>Created: {formatDate(job.createdAt)}</div>
                          {job.processedOn && <div>Started: {formatDate(job.processedOn)}</div>}
                          {job.finishedOn && (
                            <div>
                              Finished: {formatDate(job.finishedOn)}
                              {calculateDuration(job) && ` (Duration: ${calculateDuration(job)})`}
                            </div>
                          )}
                          {job.attempts > 0 && (
                            <div>Attempts: {job.attempts}/{job.maxAttempts}</div>
                          )}
                        </div>
                        
                        {job.status === 'active' && (
                          <div style={{ marginTop: '0.5rem' }}>
                            <div className="progress-bar" style={{ marginBottom: '0.25rem' }}>
                              <div className="progress-bar-filled" style={{ width: `${job.progress}%` }}></div>
                            </div>
                            <div className="terminal-comment" style={{ fontSize: '0.85rem' }}>{job.progress}% complete</div>
                          </div>
                        )}
                        
                        {job.data && Object.keys(job.data).length > 0 && (
                          <details style={{ marginTop: '0.5rem' }}>
                            <summary style={{ cursor: 'pointer' }}>
                              Job Data
                            </summary>
                            <pre style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                              <code>{JSON.stringify(job.data, null, 2)}</code>
                            </pre>
                          </details>
                        )}
                        
                        {job.result && (
                          <details style={{ marginTop: '0.5rem' }}>
                            <summary style={{ cursor: 'pointer', color: 'var(--success)' }}>
                              <strong>Result</strong>
                            </summary>
                            <pre style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                              <code>{JSON.stringify(job.result, null, 2)}</code>
                            </pre>
                          </details>
                        )}
                        
                        {job.error && (
                          <details style={{ marginTop: '0.5rem' }} open>
                            <summary style={{ cursor: 'pointer', color: 'var(--error)' }}>
                              <strong>Error</strong>
                            </summary>
                            <div style={{ marginTop: '0.5rem', color: 'var(--error)', fontSize: '0.875rem' }}>
                              {job.error}
                            </div>
                          </details>
                        )}
                        </div>
                        
                        {/* Job Actions */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                          {job.status === 'failed' && (
                            <button
                              onClick={() => retryJobMutation.mutate(job.id)}
                              disabled={retryJobMutation.isPending}
                              className="btn btn-default btn-small"
                              title="Retry Job"
                            >
                              ↻ Retry
                            </button>
                          )}
                          <button
                            onClick={() => removeJobMutation.mutate(job.id)}
                            disabled={removeJobMutation.isPending}
                            className="btn btn-error btn-ghost btn-small"
                            title="Remove Job"
                          >
                            × Remove
                          </button>
                        </div>
                      </div>
                    </div>
                ))}
                
                {filteredJobs.length === 0 && (
                  <div className="terminal-alert terminal-alert-primary" style={{ textAlign: 'center' }}>
                    No jobs yet. Create one to get started!
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="terminal-card">
            <header>
              <h2>Queue Statistics</h2>
            </header>
            <div style={{ padding: '1rem' }}>
            {statsLoading ? (
              <div className="terminal-alert">Loading statistics...</div>
            ) : statsData ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <StatCard title="Waiting" value={statsData.waiting} type="default" />
                <StatCard title="Active" value={statsData.active} type="info" />
                <StatCard title="Completed" value={statsData.completed} type="success" />
                <StatCard title="Failed" value={statsData.failed} type="error" />
                <StatCard title="Delayed" value={statsData.delayed} type="warning" />
                <StatCard title="Paused" value={statsData.paused} type="default" />
                <StatCard title="Total" value={statsData.total} type="primary" />
              </div>
            ) : (
              <div className="terminal-alert terminal-alert-error">Failed to load statistics</div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Statistics Card Component
function StatCard({ title, value, type = 'default' }: { title: string; value: number; type?: 'default' | 'primary' | 'success' | 'error' | 'warning' | 'info' }) {
  const badgeClass = type === 'default' ? '' : `terminal-alert-${type}`;
  return (
    <div className={`terminal-alert ${badgeClass}`} style={{ textAlign: 'center' }}>
      <div className="terminal-comment" style={{ marginBottom: '0.5rem' }}>{title}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}