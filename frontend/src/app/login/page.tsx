'use client';

import { Suspense } from 'react';
import { LoginLayout } from '@/components/auth/LoginLayout';
import { LoginPageSkeleton } from '@/components/auth/LoginPageSkeleton';

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginLayout />
    </Suspense>
  );
}
