import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  FiSun,
  FiMoon,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiPlus,
  FiUser,
  FiLogIn,
} from "react-icons/fi";

interface HealthStatus {
  status: string;
  message: string;
}

export function HomePage() {
  const [count, setCount] = useState(0);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  const { isAuthenticated, user } = useAuth();

  const API_URL = import.meta.env.DEV
    ? "http://localhost:3001"
    : import.meta.env.VITE_API_URL || "https://bun-app-server.fly.dev";

  const {
    data: healthStatus,
    error: healthError,
    isLoading,
    refetch,
  } = useQuery<HealthStatus>({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/health`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const toggleTheme = () => {
    setIsDarkTheme(!isDarkTheme);
  };

  useEffect(() => {
    if (isDarkTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkTheme]);

  return (
    <div className="home-container">
      <div className="home-content">
        <header className="home-header">
          <div className="home-header-content">
            <div className="home-title">
              <h1>React + Vite + Elysia</h1>
              <p>Running on Fly.io with Better-Auth</p>
            </div>
            <div className="home-actions">
              <button
                className="btn btn-ghost"
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {isDarkTheme ? <FiSun size={20} /> : <FiMoon size={20} />}
              </button>
              {isAuthenticated ? (
                <div className="auth-info">
                  <FiUser size={16} /> Welcome, {user?.name}!{" "}
                  <Link to="/dashboard" className="btn btn-primary btn-sm">
                    Dashboard
                  </Link>
                </div>
              ) : (
                <div className="auth-links">
                  <Link to="/login" className="btn btn-primary btn-sm">
                    <FiLogIn size={14} /> Sign In
                  </Link>
                  <Link to="/register" className="btn btn-ghost btn-sm">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="home-grid">
          <div className="home-card">
            <h2>API Status</h2>
            <div className="status-content">
              <div className="status-indicator">
                {isLoading && (
                  <span className="loading">
                    <FiRefreshCw className="spin" size={16} /> Checking API...
                  </span>
                )}
                {healthStatus && !isLoading && (
                  <span className="status-ok">
                    <FiCheck size={16} /> API Connected
                  </span>
                )}
                {healthError && !isLoading && (
                  <span className="status-error">
                    <FiX size={16} /> API Disconnected
                  </span>
                )}
              </div>
              <button
                className="btn btn-primary btn-block"
                onClick={(e) => {
                  refetch();
                  e.currentTarget.blur();
                }}
                disabled={isLoading}
              >
                <FiRefreshCw size={14} className={isLoading ? "spin" : ""} />
                {isLoading ? " Checking..." : " Check API"}
              </button>
            </div>
          </div>

          <div className="home-card">
            <h2>Counter Demo</h2>
            <div className="counter-content">
              <p className="counter-display">
                Count: <strong>{count}</strong>
              </p>
              <button
                className="btn btn-default btn-block"
                onClick={(e) => {
                  setCount((count) => count + 1);
                  e.currentTarget.blur();
                }}
              >
                <FiPlus size={14} /> Increment
              </button>
            </div>
          </div>

          <div className="home-card">
            <h2>About</h2>
            <div className="about-content">
              <p>This is a full-stack React app with:</p>
              <ul>
                <li>Vite for fast development</li>
                <li>Elysia backend on Bun</li>
                <li>Better-Auth authentication</li>
                <li>PostgreSQL database</li>
                <li>Terminal.css styling</li>
                <li>Deployed on Fly.io</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}