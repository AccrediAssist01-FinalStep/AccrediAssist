import { ROLE_PERMISSIONS, type Permission } from '@/types/auth';
import type { UserRole } from '@/types';

export const hasPermission = (role: UserRole | undefined, permission: Permission): boolean => {
  if (!role) return false;
  return ROLE_PERMISSIONS[permission].includes(role);
};

export const canAccessRoute = (role: UserRole | undefined, permission?: Permission | null): boolean => {
  if (permission === null || permission === undefined) return Boolean(role);
  return hasPermission(role, permission);
};
