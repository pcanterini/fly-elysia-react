import React, { useEffect, useState } from 'react';
import { auth } from '../lib/auth';
import type { User } from '@my-app/shared';
import { AuthContext, type AuthContextType } from './AuthContextDefinition';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const session = await auth.getSession();
      if (session.data?.user) {
        setUser(session.data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    const result = await auth.signIn.email({
      email,
      password,
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    await fetchUser();
  };

  const signUp = async (email: string, password: string, name: string) => {
    const result = await auth.signUp.email({
      email,
      password,
      name,
    });
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    await fetchUser();
  };

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    refetch: fetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}