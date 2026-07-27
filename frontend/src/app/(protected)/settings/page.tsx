'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SettingsAccount,
  SettingsAppearance,
  SettingsNotifications,
  useUserPreferences,
} from '@/features/settings';

export default function SettingsPage() {
  const { preferences, updatePreferences, isLoaded } = useUserPreferences();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="max-w-2xl text-muted">
            Configure appearance, notifications, and account preferences for AccrediAssist.
          </p>
        </div>
        <Button variant="outline" asChild className="gap-2">
          <Link href="/profile">
            <UserCircle className="size-4" />
            View Profile
          </Link>
        </Button>
      </div>

      {!isLoaded ? (
        <div className="space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : (
        <>
          <SettingsAppearance />
          <SettingsNotifications preferences={preferences} onChange={updatePreferences} />
          <SettingsAccount preferences={preferences} onChange={updatePreferences} />
        </>
      )}
    </motion.div>
  );
}
