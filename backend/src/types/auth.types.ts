import { UserRole } from '../models/base.model';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

export type Permission =
  | 'dashboard'
  | 'pending_records_view'
  | 'pending_records_approve'
  | 'reports'
  | 'search'
  | 'user_management'
  | 'system_logs'
  | 'whatsapp_settings';

export const ROLE_PERMISSIONS: Record<Permission, UserRole[]> = {
  dashboard: ['Admin', 'HOD', 'Faculty', 'AccreditationCommittee'],
  pending_records_view: ['Admin', 'HOD', 'Faculty'],
  pending_records_approve: ['Admin', 'Faculty'],
  reports: ['Admin', 'HOD', 'Faculty', 'AccreditationCommittee'],
  search: ['Admin', 'HOD', 'Faculty', 'AccreditationCommittee'],
  user_management: ['Admin'],
  system_logs: ['Admin'],
  whatsapp_settings: ['Admin'],
};
