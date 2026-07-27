'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_USER_PREFERENCES, type UserPreferences } from '../types';

const STORAGE_KEY = 'accrediassist-user-preferences';

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPreferences({ ...DEFAULT_USER_PREFERENCES, ...JSON.parse(stored) });
      }
    } catch {
      setPreferences(DEFAULT_USER_PREFERENCES);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return {
    preferences,
    updatePreferences,
    isLoaded,
  };
}
