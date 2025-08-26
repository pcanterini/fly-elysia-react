import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { 
  FiSun, 
  FiMoon, 
  FiUser, 
  FiMail, 
  FiCheckCircle,
  FiCalendar,
  FiSettings,
  FiLock,
  FiHome,
  FiLogOut
} from 'react-icons/fi';

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const { isDarkTheme, toggleTheme } = useTheme();

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
              <h1>Dashboard</h1>
              <p>Manage your account and settings</p>
            </div>
            <div className="dashboard-actions">
              <button
                className="btn btn-ghost"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title={isDarkTheme ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkTheme ? <FiSun size={18} /> : <FiMoon size={18} />}
              </button>
              <Link to="/" className="btn btn-ghost">
                <FiHome size={16} /> Home
              </Link>
              <button
                onClick={handleSignOut}
                className="btn btn-danger"
              >
                <FiLogOut size={16} /> Sign Out
              </button>
            </div>
          </div>
        </header>
        
        <div className="dashboard-main">
          <div className="profile-section">
            <h2><FiUser size={20} /> Profile Information</h2>
            <div className="profile-grid">
              <div className="profile-item">
                <FiUser size={16} className="profile-icon" />
                <div>
                  <span className="profile-label">Name</span>
                  <span className="profile-value">{user?.name}</span>
                </div>
              </div>
              
              <div className="profile-item">
                <FiMail size={16} className="profile-icon" />
                <div>
                  <span className="profile-label">Email</span>
                  <span className="profile-value">{user?.email}</span>
                </div>
              </div>
              
              <div className="profile-item">
                <FiCheckCircle size={16} className="profile-icon" />
                <div>
                  <span className="profile-label">Email Status</span>
                  <span className="profile-value">
                    {user?.emailVerified ? 
                      <span className="status-ok">Verified</span> : 
                      <span className="status-warning">Not Verified</span>
                    }
                  </span>
                </div>
              </div>
              
              <div className="profile-item">
                <FiCalendar size={16} className="profile-icon" />
                <div>
                  <span className="profile-label">Member Since</span>
                  <span className="profile-value">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="actions-grid">
            <button className="action-card">
              <FiSettings size={24} />
              <span>Account Settings</span>
              <p>Update your profile information</p>
            </button>
            
            <button className="action-card">
              <FiLock size={24} />
              <span>Security</span>
              <p>Change password and security settings</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}