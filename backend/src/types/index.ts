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

export type { UserRole } from '../models/base.model';

export * from './user.types';
export * from './auditLog.types';
