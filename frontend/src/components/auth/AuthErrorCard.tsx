'use client';

import { AlertCircle, ServerCrash, ShieldAlert, WifiOff } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AuthErrorCode } from '@/lib/auth-utils';
import { cn } from '@/lib/utils';

const ERROR_ICONS: Record<AuthErrorCode, React.ElementType> = {
  invalid_credentials: ShieldAlert,
  network: WifiOff,
  server: ServerCrash,
  session_expired: AlertCircle,
  unknown: AlertCircle,
};

const ERROR_STYLES: Record<AuthErrorCode, string> = {
  invalid_credentials: 'border-danger/25 bg-danger/5 text-danger',
  network: 'border-warning/25 bg-warning/5 text-warning',
  server: 'border-warning/25 bg-warning/5 text-warning',
  session_expired: 'border-primary/25 bg-primary/5 text-primary',
  unknown: 'border-danger/25 bg-danger/5 text-danger',
};

interface AuthErrorCardProps {
  code: AuthErrorCode;
  title: string;
  message: string;
  className?: string;
}

export function AuthErrorCard({ code, title, message, className }: AuthErrorCardProps) {
  const Icon = ERROR_ICONS[code] ?? AlertCircle;
  const style = ERROR_STYLES[code] ?? ERROR_STYLES.unknown;

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn('flex gap-3 rounded-xl border p-4', style, className)}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-sm opacity-90">{message}</p>
      </div>
    </motion.div>
  );
}
