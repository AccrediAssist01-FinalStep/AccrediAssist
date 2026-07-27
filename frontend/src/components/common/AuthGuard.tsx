'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { LoginPageSkeleton } from '@/components/auth/LoginPageSkeleton';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, token, fetchProfile, isLoading, isInitializing } = useAuth();

  useEffect(() => {
    if (token && !isAuthenticated && !isLoading) {
      void fetchProfile();
    }
  }, [token, isAuthenticated, isLoading, fetchProfile]);

  useEffect(() => {
    if (!isInitializing && !isLoading && !isAuthenticated && !token) {
      router.replace('/login');
    }
  }, [isAuthenticated, token, isLoading, isInitializing, router]);

  if (isInitializing) {
    return <LoginPageSkeleton />;
  }

  if (!isAuthenticated && !token) {
    return null;
  }

  if (!isAuthenticated && (isLoading || token)) {
    return <LoginPageSkeleton />;
  }

  return <>{children}</>;
}
