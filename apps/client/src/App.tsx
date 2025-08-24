import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

interface HealthStatus {
  status: string;
  message: string;
}

function App() {
  const [count, setCount] = useState(0);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkHealth = async () => {
    setIsLoading(true);
    setHealthError(null);
    try {
      const response = await fetch("https://bun-app-server.fly.dev/api/health");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: HealthStatus = await response.json();
      setHealthStatus(data);
    } catch (error) {
      setHealthError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      setHealthStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>

      <div className="card">
        <h2>API Health Check</h2>
        <div style={{ marginBottom: "1rem" }}>
          {isLoading && <p>🔄 Checking API health...</p>}
          {healthStatus && !isLoading && (
            <p style={{ color: "green" }}>
              ✅ API Status: {healthStatus.status} - {healthStatus.message}
            </p>
          )}
          {healthError && !isLoading && (
            <p style={{ color: "red" }}>❌ API Error: {healthError}</p>
          )}
        </div>
        <button onClick={checkHealth} disabled={isLoading}>
          {isLoading ? "Checking..." : "Check API Health"}
        </button>
      </div>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
