'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/button';
import { ErrorIllustration } from '@/components/illustrations';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <Logo size="sm" className="mb-8" />
      <ErrorIllustration className="size-40" aria-hidden="true" />
      <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">Something went wrong</h1>
      <p className="mt-2 max-w-md text-muted">
        An unexpected error occurred. Please try again or return to the dashboard.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
