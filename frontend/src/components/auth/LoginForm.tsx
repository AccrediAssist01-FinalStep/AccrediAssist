'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { FloatingLabelInput } from '@/components/auth/FloatingLabelInput';
import { PasswordField } from '@/components/auth/PasswordField';
import { AuthErrorCard } from '@/components/auth/AuthErrorCard';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/branding/Logo';
import { useAuth } from '@/providers/AuthProvider';
import { useAuthStore } from '@/store/auth.store';
import {
  createSessionExpiredError,
  getRememberedEmail,
  resolvePostLoginPath,
  setRememberedEmail,
  type AuthErrorCode,
  type ParsedAuthError,
} from '@/lib/auth-utils';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid institutional email'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, isAuthenticated, user } = useAuth();
  const [authError, setAuthError] = useState<ParsedAuthError | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    const remembered = getRememberedEmail();
    if (remembered) {
      setValue('email', remembered);
      setValue('rememberMe', true);
    }
  }, [setValue]);

  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      setAuthError(createSessionExpiredError());
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const destination = resolvePostLoginPath(user.role, searchParams.get('redirect'));
      router.replace(destination);
    }
  }, [isAuthenticated, user, router, searchParams]);

  const onSubmit = async (data: LoginFormData) => {
    setAuthError(null);

    try {
      await login(data);

      if (data.rememberMe) {
        setRememberedEmail(data.email);
      } else {
        setRememberedEmail(null);
      }

      const loggedInUser = useAuthStore.getState().user;
      toast.success(`Welcome back${loggedInUser?.name ? `, ${loggedInUser.name.split(' ')[0]}` : ''}!`);

      const destination = resolvePostLoginPath(
        loggedInUser?.role,
        searchParams.get('redirect'),
      );
      router.push(destination);
    } catch (error) {
      const parsed =
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        'title' in error &&
        'message' in error
          ? (error as ParsedAuthError)
          : null;

      if (parsed) {
        setAuthError(parsed);
        toast.error(parsed.title);
      }
    }
  };

  const handleForgotPassword = () => {
    toast.info('Please contact your institution administrator to reset your password.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-[420px]"
    >
      <div className="mb-8 lg:hidden">
        <Logo size="md" />
      </div>

      <div className="glass rounded-2xl border border-white/40 p-8 shadow-elevated dark:border-white/10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-muted">
            Enter your credentials to access the faculty portal
          </p>
        </div>

        <AnimatePresence mode="wait">
          {authError && (
            <div className="mb-6">
              <AuthErrorCard
                code={authError.code as AuthErrorCode}
                title={authError.title}
                message={authError.message}
              />
            </div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FloatingLabelInput
            label="Email address"
            type="email"
            autoComplete="email"
            inputMode="email"
            aria-required="true"
            error={errors.email?.message}
            {...register('email')}
          />

          <PasswordField
            label="Password"
            aria-required="true"
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex items-center justify-between gap-4">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted">
              <input
                type="checkbox"
                className="size-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30"
                {...register('rememberMe')}
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              Forgot password?
            </button>
          </div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              className="h-12 w-full text-base font-semibold"
              size="lg"
              isLoading={isLoading}
              aria-busy={isLoading}
            >
              Sign in to AccrediAssist
            </Button>
          </motion.div>
        </form>

        <p className="mt-8 text-center text-xs text-muted">
          By signing in, you agree to your institution&apos;s acceptable use policy.{' '}
          <Link href="/unauthorized" className="text-primary hover:underline">
            Need help?
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
