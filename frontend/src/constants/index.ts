export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';

export const APP_NAME = 'AccrediAssist';

export const USER_ROLES = {
  ADMIN: 'Admin',
  HOD: 'HOD',
  FACULTY: 'Faculty',
  ACCREDITATION_COMMITTEE: 'AccreditationCommittee',
} as const;
