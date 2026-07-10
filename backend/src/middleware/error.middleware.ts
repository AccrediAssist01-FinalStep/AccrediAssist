import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import {
  AppError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../utils/errors';
import { sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env';

const isDuplicateKeyError = (error: Error): boolean => {
  return 'code' in error && (error as { code?: number }).code === 11000;
};

const getDuplicateKeyMessage = (error: Error): string => {
  const keyValue = (error as { keyValue?: Record<string, unknown> }).keyValue;
  if (keyValue) {
    const field = Object.keys(keyValue)[0];
    return `${field} already exists`;
  }
  return 'Duplicate field value';
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): Response => {
  if (err instanceof AppError) {
    logger.warn('Application error', {
      message: err.message,
      statusCode: err.statusCode,
      code: err.code,
      errors: err.errors,
    });
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  if (err instanceof MongooseError.CastError) {
    logger.warn('Mongoose cast error', { message: err.message, path: err.path });
    return sendError(res, 'Invalid ID format', 400);
  }

  if (err instanceof MongooseError.ValidationError) {
    const errors = Object.values(err.errors).map((issue) => issue.message);
    logger.warn('Mongoose validation error', { errors });
    return sendError(res, 'Validation failed', 422, errors);
  }

  if (isDuplicateKeyError(err)) {
    logger.warn('Duplicate key error', { message: getDuplicateKeyMessage(err) });
    return sendError(res, getDuplicateKeyMessage(err), 409);
  }

  logger.error('Unhandled error', {
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  return sendError(res, 'Internal server error', 500);
};

export const notFoundHandler = (req: Request, res: Response): Response => {
  logger.warn('Route not found', { method: req.method, path: req.originalUrl });
  return sendError(res, 'Route not found', 404);
};

// Re-export error classes for convenience in route modules.
export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
  ErrorCode,
} from '../utils/errors';
