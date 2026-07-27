import {
  BarChart3,
  Bell,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/types/auth';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission | null;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  {
    label: 'Pending Reviews',
    href: '/pending-reviews',
    icon: ClipboardList,
    permission: 'pending_records_view',
  },
  { label: 'Smart Search', href: '/search', icon: Search, permission: 'search' },
  { label: 'Reports', href: '/reports', icon: FileText, permission: 'reports' },
  { label: 'Analytics', href: '/analytics', icon: BarChart3, permission: 'dashboard' },
  { label: 'Notifications', href: '/notifications', icon: Bell, permission: null },
];

export const ACCOUNT_NAV_ITEMS: NavItem[] = [
  { label: 'Profile', href: '/profile', icon: User, permission: null },
  { label: 'Settings', href: '/settings', icon: Settings, permission: null },
];

export const LOGOUT_NAV_ITEM: NavItem = {
  label: 'Logout',
  href: '/logout',
  icon: LogOut,
  permission: null,
};

export const PROTECTED_ROUTES = [
  '/dashboard',
  '/pending-reviews',
  '/search',
  '/reports',
  '/analytics',
  '/notifications',
  '/profile',
  '/settings',
];
