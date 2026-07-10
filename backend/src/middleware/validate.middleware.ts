import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';

export interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

const formatZodErrors = (error: ZodError): string[] => {
  return error.errors.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : 'value';
    return `${path}: ${issue.message}`;
  });
};

const parseSchema = <T>(schema: ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ValidationError('Validation failed', formatZodErrors(error));
    }
    throw error;
  }
};

export const validate =
  (schemas: ValidationSchemas | ZodSchema) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const schemaConfig: ValidationSchemas =
        schemas instanceof ZodSchema ? { body: schemas } : schemas;

      if (schemaConfig.body) {
        req.body = parseSchema(schemaConfig.body, req.body);
      }

      if (schemaConfig.params) {
        req.params = parseSchema(schemaConfig.params, req.params) as Request['params'];
      }

      if (schemaConfig.query) {
        req.query = parseSchema(schemaConfig.query, req.query) as Request['query'];
      }

      next();
    } catch (error) {
      next(error);
    }
  };

export const validateBody = (schema: ZodSchema): RequestHandler => validate({ body: schema });

export const validateParams = (schema: ZodSchema): RequestHandler => validate({ params: schema });

export const validateQuery = (schema: ZodSchema): RequestHandler => validate({ query: schema });
