'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { ErrorState } from '@/components/common/ErrorState';
import { FeaturePageHeader, PageTransition } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/AuthProvider';
import {
  EditProfileDialog,
  ProfileActivityTimeline,
  ProfileHeader,
  ProfileInfoCards,
  ProfileSecuritySection,
  useProfileData,
} from '@/features/profile';

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const profileQuery = useProfileData(user?._id);

  const profileUser = profileQuery.data?.profile ?? user;

  if (!user) {
    return (
      <ErrorState
        title="Profile unavailable"
        message="Sign in to view your profile information."
      />
    );
  }

  if (profileQuery.isLoading && !profileUser) {
    return (
      <div className="space-y-8 pb-8">
        <Skeleton className="h-40 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (profileQuery.isError || !profileUser) {
    return (
      <ErrorState
        title="Unable to load profile"
        message="We couldn't fetch your profile from the server."
        onRetry={() => profileQuery.refetch()}
      />
    );
  }

  return (
    <PageTransition>
      <FeaturePageHeader
        id="profile-heading"
        title="Profile"
        description="Your institutional identity and account overview."
        action={
          <Button variant="outline" asChild className="gap-2">
            <Link href="/settings">
              <Settings className="size-4" aria-hidden="true" />
              Account Settings
            </Link>
          </Button>
        }
      />

      <ProfileHeader user={profileUser} onEditProfile={() => setEditOpen(true)} />
      <ProfileInfoCards user={profileUser} />
      <ProfileSecuritySection user={profileUser} hasActiveSession={Boolean(token)} />
      <ProfileActivityTimeline
        activities={profileQuery.data?.activities ?? []}
        isLoading={profileQuery.isLoading}
      />

      <EditProfileDialog user={profileUser} open={editOpen} onOpenChange={setEditOpen} />
    </PageTransition>
  );
}
