import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env';

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
      errors: err.errors,
    });
    return sendError(res, err.message, err.statusCode, err.errors);
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
