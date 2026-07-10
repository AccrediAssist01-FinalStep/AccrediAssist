import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/AppError';

export const validate =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
        next(new AppError('Validation failed', 422, errors));
      } else {
        next(error);
      }
    }
  };
