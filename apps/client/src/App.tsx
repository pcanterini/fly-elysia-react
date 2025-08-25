import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FiSun,
  FiMoon,
  FiCheck,
  FiX,
  FiRefreshCw,
  FiPlus,
} from "react-icons/fi";

interface HealthStatus {
  status: string;
  message: string;
}

function App() {
  const [count, setCount] = useState(0);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return (
      localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
    );
  });

  const API_URL = import.meta.env.DEV
    ? "http://localhost:3001"
    : "https://bun-app-server.fly.dev";

  const {
    data: healthStatus,
    error: healthError,
    isLoading,
    refetch,
  } = useQuery<HealthStatus>({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/health`);
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
    <div className="app">
      <button
        className="btn btn-ghost theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {isDarkTheme ? <FiSun size={20} /> : <FiMoon size={20} />}
      </button>

      <main>
        <h1>React + Vite + Elysia</h1>
        <p className="subtitle">Running on Fly.io</p>

        <div className="status-section">
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
            className="btn btn-primary"
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

        <div className="counter-section">
          <p>
            Count: <strong>{count}</strong>
          </p>
          <button
            className="btn btn-default"
            onClick={(e) => {
              setCount((count) => count + 1);
              e.currentTarget.blur();
            }}
          >
            <FiPlus size={14} /> Increment
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
