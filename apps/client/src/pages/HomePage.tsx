import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { apiClient, queryKeys } from "../lib/api";
import type { HealthResponse } from "@my-app/shared";
import {
  FiSun,
  FiMoon,
  FiRefreshCw,
  FiServer,
  FiActivity,
} from "react-icons/fi";

export function HomePage() {
  const [count, setCount] = useState(0);
  const { isDarkTheme, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();

  const {
    data: healthStatus,
    error: healthError,
    isLoading,
    refetch,
  } = useQuery<HealthResponse>({
    queryKey: queryKeys.health,
    queryFn: () => apiClient.health(),
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });


  return (
    <div className="home-container">
      <div className="home-content">
        <header className="home-header">
          <div className="home-header-content">
            <div className="home-title">
              <h1>Welcome to Your App</h1>
              <p>Full-stack TypeScript on Fly.io</p>
            </div>
            <div className="home-actions">
              <button
                className="btn btn-ghost"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                title={isDarkTheme ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkTheme ? <FiSun size={18} /> : <FiMoon size={18} />}
              </button>
              {isAuthenticated ? (
                <>
                  <span className="user-greeting">Hello, {user?.name}</span>
                  <Link to="/dashboard" className="btn btn-primary">
                    Go to Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-primary">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn-ghost">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="home-main">
          <div className="home-hero">
            <h2>Build something amazing</h2>
            <p>A modern full-stack starter with everything you need</p>
            
            <div className="status-row">
              <div className="status-item">
                <FiServer size={20} />
                <div>
                  <span className="status-label">API Status</span>
                  <span className="status-value">
                    {isLoading && "Checking..."}
                    {healthStatus && !isLoading && <span className="status-ok">Online</span>}
                    {healthError && !isLoading && <span className="status-error">Offline</span>}
                  </span>
                </div>
              </div>
              
              <div className="status-item">
                <FiActivity size={20} />
                <div>
                  <span className="status-label">Click Counter</span>
                  <span className="status-value">{count}</span>
                </div>
              </div>
              
              <button
                className="btn btn-ghost"
                onClick={() => {
                  setCount(c => c + 1);
                  refetch();
                }}
                title="Refresh status and increment counter"
              >
                <FiRefreshCw size={16} className={isLoading ? "spin" : ""} />
              </button>
            </div>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <h3>Modern Stack</h3>
              <p>React 19, TypeScript, Vite, and Bun for blazing fast development</p>
            </div>
            <div className="feature-card">
              <h3>Authentication</h3>
              <p>Secure user authentication with Better-Auth and session management</p>
            </div>
            <div className="feature-card">
              <h3>Database Ready</h3>
              <p>PostgreSQL with Drizzle ORM for type-safe database operations</p>
            </div>
            <div className="feature-card">
              <h3>Deploy Anywhere</h3>
              <p>Optimized for Fly.io with auto-scaling and global distribution</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}