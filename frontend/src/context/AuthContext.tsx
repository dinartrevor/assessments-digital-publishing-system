'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load token and user from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('dps_token');
    const storedUser = localStorage.getItem('dps_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);

    // Listen for global logout events from axios interceptor
    const handleGlobalLogout = () => {
      setUser(null);
      setToken(null);
      router.push('/login');
    };

    window.addEventListener('auth-logout', handleGlobalLogout);
    return () => {
      window.removeEventListener('auth-logout', handleGlobalLogout);
    };
  }, [router]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/login', { email, password });
      const { access_token, user: userData } = response.data.data;

      localStorage.setItem('dps_token', access_token);
      localStorage.setItem('dps_user', JSON.stringify(userData));

      setToken(access_token);
      setUser(userData);
      
      router.push('/admin/dashboard');
    } catch (error: any) {
      setLoading(false);
      throw error.response?.data?.message || 'Login failed. Please check your credentials.';
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/register', {
        name,
        email,
        password,
        password_confirmation: password,
      });
      const { access_token, user: userData } = response.data.data;

      localStorage.setItem('dps_token', access_token);
      localStorage.setItem('dps_user', JSON.stringify(userData));

      setToken(access_token);
      setUser(userData);

      router.push('/admin/dashboard');
    } catch (error: any) {
      setLoading(false);
      const errors = error.response?.data?.errors;
      if (errors) {
        const firstError = Object.values(errors)[0] as string[];
        throw firstError[0] || 'Registration failed.';
      }
      throw error.response?.data?.message || 'Registration failed.';
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Best-effort logout to backend
      await api.post('/logout').catch(() => {});
    } finally {
      localStorage.removeItem('dps_token');
      localStorage.removeItem('dps_user');
      setUser(null);
      setToken(null);
      setLoading(false);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
