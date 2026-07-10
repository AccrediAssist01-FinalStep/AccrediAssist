export enum ErrorCode {
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class AppError extends Error {
  readonly statusCode: number;
  readonly errors?: string[];
  readonly code: ErrorCode;
  readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode = 400,
    errors?: string[],
    code: ErrorCode = ErrorCode.BAD_REQUEST,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', errors?: string[]) {
    super(message, 400, errors, ErrorCode.BAD_REQUEST);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, undefined, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, undefined, ErrorCode.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, undefined, ErrorCode.NOT_FOUND);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists', errors?: string[]) {
    super(message, 409, errors, ErrorCode.CONFLICT);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors?: string[]) {
    super(message, 422, errors, ErrorCode.VALIDATION_ERROR);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error') {
    super(message, 500, undefined, ErrorCode.INTERNAL_ERROR, false);
  }
}
