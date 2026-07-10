'use client';

import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/common/Button';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted">Welcome back, {user?.name}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-white p-6">
          <p className="text-sm text-muted">Role</p>
          <p className="mt-1 text-lg font-semibold">{user?.role}</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-6">
          <p className="text-sm text-muted">Department</p>
          <p className="mt-1 text-lg font-semibold">{user?.department ?? '—'}</p>
        </div>
        <div className="rounded-lg border border-border bg-white p-6">
          <p className="text-sm text-muted">Email</p>
          <p className="mt-1 text-lg font-semibold">{user?.email}</p>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-white p-8 text-center">
        <p className="text-muted">
          Sprint 1 complete. Dashboard modules will be added in upcoming sprints.
        </p>
      </div>
    </div>
  );
}
