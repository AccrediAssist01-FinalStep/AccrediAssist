'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, token, fetchProfile, isLoading } = useAuthStore();

  useEffect(() => {
    if (token && !isAuthenticated) {
      fetchProfile();
    }
  }, [token, isAuthenticated, fetchProfile]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !token) {
      router.replace('/login');
    }
  }, [isAuthenticated, token, isLoading, router]);

  if (!isAuthenticated && !token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Redirecting to login...</p>
      </div>
    );
  }

  return <>{children}</>;
}
