import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getStoredUser, getStoredToken, logout as authLogout } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  authType: 'jwt' | 'session' | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  loginWithSession: (user: User) => void;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authType, setAuthType] = useState<'jwt' | 'session' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored JWT authentication first
    const storedUser = getStoredUser();
    const storedToken = getStoredToken();

    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
      setAuthType('jwt');
      setIsLoading(false);
      return;
    }

    // Check for session-based authentication (Google OAuth)
    checkSessionAuth();
  }, []);

  const checkSessionAuth = async () => {
    try {
      const response = await fetch('/api/auth/status');
      if (response.ok) {
        const data = await response.json();
        if (data.isAuthenticated && data.user) {
          setUser(data.user);
          setAuthType('session');
          
          // Check if Google OAuth user needs to complete profile
          if (data.user.authProvider === 'google' && !data.user.profileCompleted) {
            // Don't redirect here, let the routing handle it
            console.log('User needs to complete profile');
          }
        }
      }
    } catch (error) {
      console.log('Session check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    setAuthType('jwt');
  };

  const loginWithSession = (newUser: User) => {
    setUser(newUser);
    setAuthType('session');
  };

  const logout = async () => {
    if (authType === 'session') {
      // Session-based logout for Google OAuth
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        console.error('Session logout error:', error);
      }
    } else {
      // JWT logout
      authLogout();
    }
    
    setUser(null);
    setToken(null);
    setAuthType(null);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    // Update stored user data
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    authType,
    isAuthenticated: !!user && (!!token || authType === 'session'),
    login,
    loginWithSession,
    logout,
    updateUser,
    isLoading,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
