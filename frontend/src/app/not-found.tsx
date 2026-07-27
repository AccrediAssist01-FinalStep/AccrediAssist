import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ErrorIllustration } from '@/components/illustrations';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <ErrorIllustration className="size-48" />
      <h1 className="mt-6 text-4xl font-bold">404</h1>
      <p className="mt-2 max-w-md text-muted">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Button asChild className="mt-8">
        <Link href="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  );
}
