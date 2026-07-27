'use client';

import { PageHeader } from '@/components/layout/AppShell';
import { useAuth } from '@/providers/AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfilePage() {
  const { user } = useAuth();

  const initials = user?.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-8">
      <PageHeader title="Profile" description="Manage your account information and preferences." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center pt-8">
            <Avatar className="size-24">
              <AvatarImage src={user?.profileImage} alt={user?.name} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-xl font-semibold">{user?.name}</h2>
            <p className="text-sm text-muted">{user?.email}</p>
            <Badge className="mt-3">{user?.role}</Badge>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>Your profile information from the institution directory</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={user?.name ?? ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={user?.department ?? '—'} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Designation</Label>
              <Input value={user?.designation ?? '—'} readOnly />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
