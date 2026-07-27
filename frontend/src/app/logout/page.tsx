'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';

export default function LogoutPage() {
  const { logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      await logout();
      toast.success('Signed out successfully');
      router.replace('/login');
    };
    void performLogout();
  }, [logout, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <Skeleton className="h-4 w-48" />
      <p className="text-sm text-muted">Signing out...</p>
    </div>
  );
}
