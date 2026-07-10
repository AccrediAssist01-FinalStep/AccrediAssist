import { Response } from 'express';
import {
  ApiErrorResponse,
  ApiSuccessResponse,
  PaginatedData,
  PaginationMeta,
} from '../types/api.types';

export const buildSuccessResponse = <T>(
  message: string,
  data?: T,
): ApiSuccessResponse<T> => ({
  success: true,
  message,
  data,
});

export const buildErrorResponse = (
  message: string,
  errors?: string[],
): ApiErrorResponse => ({
  success: false,
  message,
  errors,
});

export const buildPaginatedResponse = <T>(
  message: string,
  items: T[],
  meta: PaginationMeta,
): ApiSuccessResponse<PaginatedData<T>> => ({
  success: true,
  message,
  data: { items, meta },
});

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
): Response => {
  return res.status(statusCode).json(buildSuccessResponse(message, data));
};

export const sendCreated = <T>(res: Response, message: string, data: T): Response => {
  return sendSuccess(res, message, data, 201);
};

export const sendPaginatedSuccess = <T>(
  res: Response,
  message: string,
  items: T[],
  meta: PaginationMeta,
  statusCode = 200,
): Response => {
  return res.status(statusCode).json(buildPaginatedResponse(message, items, meta));
};

export const sendNoContent = (res: Response): Response => {
  return res.status(204).send();
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: string[],
): Response => {
  return res.status(statusCode).json(buildErrorResponse(message, errors));
};
