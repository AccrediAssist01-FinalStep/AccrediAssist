export class AppError extends Error {
  statusCode: number;
  errors?: string[];

  constructor(message: string, statusCode = 400, errors?: string[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
