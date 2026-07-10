import bcrypt from 'bcrypt';
import { AppError } from './AppError';

export const SALT_ROUNDS = 12;

const validatePasswordInput = (password: string): void => {
  if (!password || password.trim().length === 0) {
    throw new AppError('Password is required', 400);
  }
};

/**
 * Hash a plain-text password using bcrypt.
 */
export const hashPassword = async (password: string): Promise<string> => {
  validatePasswordInput(password);
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a plain-text password against a bcrypt hash.
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  validatePasswordInput(password);

  if (!hashedPassword) {
    throw new AppError('Stored password hash is missing', 500);
  }

  return bcrypt.compare(password, hashedPassword);
};
