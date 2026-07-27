'use client';

import { motion } from 'framer-motion';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const themeOptions = [
  { value: 'light', label: 'Light Mode', icon: Sun, description: 'Bright interface for daytime use' },
  { value: 'dark', label: 'Dark Mode', icon: Moon, description: 'Reduced glare for low-light environments' },
  { value: 'system', label: 'System Mode', icon: Monitor, description: 'Follow your device appearance settings' },
] as const;

export function SettingsAppearance() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>Choose how AccrediAssist looks on your device</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {themeOptions.map((option, index) => {
          const Icon = option.icon;
          const isActive = theme === option.value;

          return (
            <motion.button
              key={option.value}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -2 }}
              onClick={() => setTheme(option.value)}
              className={cn(
                'rounded-xl border p-4 text-left transition-all',
                isActive
                  ? 'border-primary bg-primary/5 shadow-soft ring-2 ring-primary/20'
                  : 'border-border bg-card hover:shadow-soft',
              )}
              aria-label={`Set theme to ${option.label}`}
              aria-pressed={isActive}
            >
              <Icon className={cn('size-5', isActive ? 'text-primary' : 'text-muted')} />
              <p className="mt-3 font-medium">{option.label}</p>
              <p className="mt-1 text-sm text-muted">{option.description}</p>
            </motion.button>
          );
        })}
      </CardContent>
    </Card>
  );
}
