'use client';

import Link from 'next/link';
import { WifiOff } from 'lucide-react';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/button';

export default function NetworkErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <Logo size="sm" className="mb-8" />
      <div className="flex size-20 items-center justify-center rounded-full bg-warning/10">
        <WifiOff className="size-10 text-warning" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">Connection lost</h1>
      <p className="mt-2 max-w-md text-muted">
        Unable to reach the server. Check your internet connection and try again.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={() => window.location.reload()}>Retry</Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
