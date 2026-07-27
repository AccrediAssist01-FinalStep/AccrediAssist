'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function LoginPageSkeleton() {
  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 bg-accent lg:block">
        <div className="flex h-full flex-col justify-between p-12">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64 w-full max-w-md rounded-2xl" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6 rounded-2xl border border-border p-8">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
