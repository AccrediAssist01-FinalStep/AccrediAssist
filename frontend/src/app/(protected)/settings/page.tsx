'use client';

import Link from 'next/link';
import { UserCircle } from 'lucide-react';
import { FeaturePageHeader, PageTransition } from '@/components/layout/PageLayout';
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
    <PageTransition>
      <FeaturePageHeader
        id="settings-heading"
        title="Settings"
        description="Configure appearance, notifications, and account preferences for AccrediAssist."
        action={
          <Button variant="outline" asChild className="gap-2">
            <Link href="/profile">
              <UserCircle className="size-4" aria-hidden="true" />
              View Profile
            </Link>
          </Button>
        }
      />

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
    </PageTransition>
  );
}
