'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { StatCardsSkeleton } from '@/components/common/LoadingSkeletons';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, token, fetchProfile, isLoading } = useAuth();

  useEffect(() => {
    if (token && !isAuthenticated) {
      void fetchProfile();
    }
  }, [token, isAuthenticated, fetchProfile]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !token) {
      router.replace('/login');
    }
  }, [isAuthenticated, token, isLoading, router]);

  if (!isAuthenticated && (isLoading || token)) {
    return (
      <div className="flex min-h-screen flex-col gap-6 bg-background p-8">
        <StatCardsSkeleton count={3} />
      </div>
    );
  }

  if (!isAuthenticated && !token) {
    return null;
  }

  return <>{children}</>;
}
