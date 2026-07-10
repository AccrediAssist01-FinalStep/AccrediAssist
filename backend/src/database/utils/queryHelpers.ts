import { FilterQuery } from 'mongoose';
import { IBaseDocument } from '../../types/base.types';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  page: number;
  limit: number;
  skip: number;
}

/**
 * Calculate skip/limit values for paginated queries.
 */
export const getPagination = (options: PaginationOptions = {}): PaginationResult => {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Merge additional filters with the active-only (non-deleted) constraint.
 */
export const withActiveFilter = <T extends IBaseDocument>(
  filters: FilterQuery<T> = {},
): FilterQuery<T> => ({
  ...filters,
  isDeleted: { $ne: true },
});

/**
 * Standard paginated response metadata.
 */
export const buildPaginationMeta = (
  total: number,
  pagination: PaginationResult,
): { total: number; page: number; limit: number; totalPages: number } => {
  const totalPages = Math.ceil(total / pagination.limit) || 1;

  return {
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages,
  };
};
