import Link from 'next/link';
import { ShieldX } from 'lucide-react';
import { Logo } from '@/components/branding/Logo';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <Logo size="sm" className="mb-8" />
      <div className="flex size-20 items-center justify-center rounded-full bg-danger/10">
        <ShieldX className="size-10 text-danger" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">Access denied</h1>
      <p className="mt-2 max-w-md text-muted">
        You don&apos;t have permission to access this page. Contact your administrator if you
        believe this is an error.
      </p>
      <Button asChild className="mt-8">
        <Link href="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
