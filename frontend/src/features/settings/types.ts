export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  compactSidebar: boolean;
  language: string;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  emailNotifications: true,
  pushNotifications: false,
  compactSidebar: false,
  language: 'en',
};

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi (Coming Soon)' },
];
