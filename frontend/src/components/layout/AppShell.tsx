'use client';

import { motion } from 'framer-motion';
import { AuthGuard } from '@/components/common/AuthGuard';
import { Sidebar } from '@/components/layout/Sidebar';
import { Footer, TopNav } from '@/components/layout/TopNav';
import { cn } from '@/lib/utils';
import { useSidebarStore } from '@/hooks/use-sidebar';
import { useIsMobile } from '@/hooks/use-media-query';

export function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { isMobileOpen, setMobileOpen } = useSidebarStore();

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {isMobile && isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute left-0 top-0 h-full"
            >
              <Sidebar onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:shadow-elevated"
          >
            Skip to main content
          </a>
          <TopNav />
          <motion.main
            id="main-content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 p-4 md:p-6 lg:p-8"
            tabIndex={-1}
          >
            <div className="mx-auto max-w-7xl">{children}</div>
          </motion.main>
          <Footer />
        </div>
      </div>
    </AuthGuard>
  );
}

export function PageHeader({
  title,
  description,
  action,
  badge,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="space-y-2">
        {badge && <div className="flex flex-wrap items-center gap-2">{badge}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
        {description && <p className="max-w-3xl text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
