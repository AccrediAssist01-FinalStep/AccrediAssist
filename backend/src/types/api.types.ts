export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: string[];
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

export type PaginatedApiResponse<T> = ApiSuccessResponse<PaginatedData<T>>;

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}
