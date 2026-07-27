'use client';

import { Globe, LayoutDashboard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { LANGUAGE_OPTIONS, type UserPreferences } from '../types';

interface SettingsAccountProps {
  preferences: UserPreferences;
  onChange: (patch: Partial<UserPreferences>) => void;
}

export function SettingsAccount({ preferences, onChange }: SettingsAccountProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Preferences</CardTitle>
        <CardDescription>Customize your AccrediAssist experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Globe className="size-4" />
            </div>
            <div>
              <p className="font-medium">Language</p>
              <p className="text-sm text-muted">Additional languages will be supported in a future release</p>
            </div>
          </div>
          <Select
            value={preferences.language}
            onValueChange={(value) => {
              if (value !== 'en') {
                toast.info('Additional languages are coming soon.');
                return;
              }
              onChange({ language: value });
            }}
          >
            <SelectTrigger className="w-[180px]" aria-label="Language preference">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <LayoutDashboard className="size-4" />
            </div>
            <div>
              <p className="font-medium">Compact Sidebar</p>
              <p className="text-sm text-muted">Reduce sidebar width for more workspace</p>
            </div>
          </div>
          <Button
            variant={preferences.compactSidebar ? 'default' : 'outline'}
            size="sm"
            onClick={() => onChange({ compactSidebar: !preferences.compactSidebar })}
            aria-pressed={preferences.compactSidebar}
          >
            {preferences.compactSidebar ? 'On' : 'Off'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
