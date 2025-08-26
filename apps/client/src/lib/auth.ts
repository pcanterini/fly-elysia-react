import { createAuthClient } from 'better-auth/client';
import { API_BASE_URL } from './api';

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
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