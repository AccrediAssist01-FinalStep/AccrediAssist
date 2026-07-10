export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export type { UserRole } from '../database/enums';

export * from './base.types';
export * from './user.types';
export * from './auditLog.types';
export * from './pendingRecord.types';
export * from './studentAchievement.types';
export * from './facultyAchievement.types';
export * from './placement.types';
export * from './internship.types';
export * from './jwt.types';
export * from './auth.types';
