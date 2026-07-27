'use client';

import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/AuthProvider';
import { formatDashboardDate, getGreeting } from '../utils/dashboard.utils';
import { DashboardHeroIllustration } from './DashboardHeroIllustration';

export function DashboardHero() {
  const { user } = useAuth();
  const greeting = getGreeting();
  const today = formatDashboardDate();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-card"
      aria-label="Dashboard welcome"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(37,99,235,0.08),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(124,58,237,0.06),transparent_50%)]" />

      <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8 lg:p-10">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-medium">
              {greeting}
            </Badge>
            <Badge variant="outline">{user?.role}</Badge>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
              {user?.name ?? 'Welcome'}
            </h1>
            <p className="mt-2 text-muted">
              {user?.department ? `${user.department} · ` : ''}
              {today}
            </p>
          </div>

          <div className="inline-flex max-w-xl rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-sm font-medium text-primary md:text-base">
              AI-Powered Academic Accreditation Platform
            </p>
          </div>
        </div>

        <div className="hidden md:block">
          <DashboardHeroIllustration className="h-36 w-56 lg:h-44 lg:w-72" />
        </div>
      </div>
    </motion.section>
  );
}
