'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/** Standard vertical rhythm for authenticated feature pages */
export const PAGE_CONTENT_CLASS = 'space-y-8 pb-8';

/** Shared page enter animation */
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] },
} as const;

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div {...pageTransition} className={cn(PAGE_CONTENT_CLASS, className)}>
      {children}
    </motion.div>
  );
}

interface FeaturePageHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
  id?: string;
}

/** Unified page header used across all feature modules */
export function FeaturePageHeader({
  title,
  description,
  badge,
  meta,
  action,
  className,
  id,
}: FeaturePageHeaderProps) {
  return (
    <header
      className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}
    >
      <div className="space-y-2">
        {(badge || meta) && (
          <div className="flex flex-wrap items-center gap-2">
            {badge}
            {meta}
          </div>
        )}
        <h1 id={id} className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description && <p className="max-w-3xl text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}

interface SectionCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/** Standard elevated section wrapper */
export function SectionCard({
  title,
  description,
  children,
  className,
  contentClassName,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-card shadow-soft transition-shadow hover:shadow-elevated',
        className,
      )}
    >
      {(title || description) && (
        <div className="border-b border-border px-6 py-4">
          {title && <h2 className="text-base font-semibold tracking-tight">{title}</h2>}
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
      )}
      <div className={cn('p-6', contentClassName)}>{children}</div>
    </section>
  );
}
