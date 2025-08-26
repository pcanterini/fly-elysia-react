import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <header className="dashboard-header">
          <div className="dashboard-header-content">
            <div>
              <h1>Welcome to your Dashboard</h1>
              <p>Hello, {user?.name}!</p>
            </div>
            <div className="dashboard-actions">
              <Link to="/" className="btn btn-ghost">
                ← Home
              </Link>
              <button
                onClick={handleSignOut}
                className="btn btn-danger"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>
        
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2>Profile Information</h2>
            <div className="profile-info">
              <p><strong>Name:</strong> {user?.name}</p>
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Email Verified:</strong> {user?.emailVerified ? 'Yes' : 'No'}</p>
              <p><strong>Member Since:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</p>
            </div>
          </div>
          
          <div className="dashboard-card">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button className="btn btn-primary btn-block">
                Update Profile
              </button>
              <button className="btn btn-default btn-block">
                Change Password
              </button>
            </div>
          </div>
          
          <div className="dashboard-card">
            <h2>Recent Activity</h2>
            <p>No recent activity to display.</p>
          </div>
        </div>
      </div>
    </div>
  );
}