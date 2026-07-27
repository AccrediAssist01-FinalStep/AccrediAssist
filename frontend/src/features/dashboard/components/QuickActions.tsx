'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Bell,
  ClipboardList,
  FileText,
  Search,
  User,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const actions: Array<{ label: string; href: string; icon: LucideIcon; gradient: string }> = [
  {
    label: 'Pending Review',
    href: '/pending-reviews',
    icon: ClipboardList,
    gradient: 'from-amber-500/15 to-orange-500/5 hover:from-amber-500/25',
  },
  {
    label: 'Search',
    href: '/search',
    icon: Search,
    gradient: 'from-blue-500/15 to-cyan-500/5 hover:from-blue-500/25',
  },
  {
    label: 'Generate Report',
    href: '/reports',
    icon: FileText,
    gradient: 'from-violet-500/15 to-purple-500/5 hover:from-violet-500/25',
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    gradient: 'from-emerald-500/15 to-green-500/5 hover:from-emerald-500/25',
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
    gradient: 'from-rose-500/15 to-red-500/5 hover:from-rose-500/25',
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: User,
    gradient: 'from-indigo-500/15 to-blue-500/5 hover:from-indigo-500/25',
  },
];

export function QuickActions() {
  return (
    <section aria-label="Quick actions">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.href}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={action.href}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl border border-border bg-gradient-to-br p-4 text-center shadow-soft transition-all',
                  action.gradient,
                )}
              >
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <span className="text-xs font-medium">{action.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
