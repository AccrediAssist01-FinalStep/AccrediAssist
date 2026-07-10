import { Response } from 'express';

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200,
): Response => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: string[],
): Response => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};
