'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/branding/Logo';
import { useAuth } from '@/providers/AuthProvider';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(searchParams.get('redirect') ?? '/dashboard');
    }
  }, [isAuthenticated, router, searchParams]);

  useEffect(() => () => clearError(), [clearError]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
      toast.success('Welcome back!');
      router.push(searchParams.get('redirect') ?? '/dashboard');
    } catch {
      toast.error('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="relative flex min-h-screen">
      {/* Left panel - branding */}
      <div className="hidden flex-1 flex-col justify-between gradient-primary p-12 text-white lg:flex">
        <Logo showText size="lg" className="[&_span]:text-white [&_.text-primary]:text-white/90" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-4xl font-bold leading-tight">
            AI-Powered Accreditation
            <br />
            Management Platform
          </h2>
          <p className="mt-4 max-w-md text-white/80">
            Streamline NAAC/NBA compliance with intelligent document processing, smart search, and
            real-time analytics for your institution.
          </p>
        </motion.div>
        <p className="text-sm text-white/60">Trusted by academic institutions worldwide</p>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>

          <div className="glass rounded-2xl p-8 shadow-elevated">
            <div className="mb-8">
              <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
              <p className="mt-2 text-sm text-muted">Sign in to your AccrediAssist account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="faculty@university.edu"
                  autoComplete="email"
                  {...register('email')}
                />
                {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  {...register('password')}
                />
                {errors.password && <p className="text-sm text-danger">{errors.password.message}</p>}
              </div>

              {error && (
                <div className="rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm text-danger">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Sign in
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
