import { createAuthClient } from 'better-auth/client';

const baseURL = import.meta.env.DEV 
  ? 'http://localhost:3001'  // Vite dev server
  : import.meta.env.VITE_API_URL || 'https://bun-app-server.fly.dev';  // Docker dev or Production

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: 'include', // Include cookies for session management
  },
  // Store session in localStorage for cross-origin compatibility
  storage: {
    get: (key: string) => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
      }
      return null;
    },
    set: (key: string, value: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, value);
      }
    },
    remove: (key: string) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key);
      }
    },
  },
});

export { authClient as auth };