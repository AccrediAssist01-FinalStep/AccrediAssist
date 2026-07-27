'use client';

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { hasPermission as checkPermission } from '@/lib/permissions';
import type { Permission } from '@/types/auth';
import type { User } from '@/types';
import type { ParsedAuthError } from '@/lib/auth-utils';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: ParsedAuthError | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const {
    user,
    token,
    fetchProfile,
    isAuthenticated,
    isLoading,
    isInitializing,
    error,
    login,
    logout,
    clearError,
    initialize,
  } = useAuthStore();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    const storedToken = token ?? (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (storedToken && !user && !isLoading) {
      void fetchProfile();
    }
  }, [token, user, isLoading, fetchProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated,
      isLoading,
      isInitializing,
      error,
      login,
      logout,
      fetchProfile,
      clearError,
      hasPermission: (permission: Permission) => checkPermission(user?.role, permission),
    }),
    [user, token, isAuthenticated, isLoading, isInitializing, error, login, logout, fetchProfile, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
