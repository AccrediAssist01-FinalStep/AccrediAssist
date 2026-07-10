/**
 * Shared helpers for model integration tests.
 */

import { hashPassword } from '../utils/password';
import { User } from '../models/User';
import { IUser } from '../types/user.types';
import { UserRole } from '../database/enums';

export const createTestUser = async (params: {
  name: string;
  email: string;
  password?: string;
  role?: UserRole;
}): Promise<IUser> => {
  const hashedPassword = await hashPassword(params.password ?? 'Test@12345');

  return User.create({
    name: params.name,
    email: params.email,
    password: hashedPassword,
    role: params.role ?? 'Faculty',
  });
};

export const cleanupTestUser = async (email: string): Promise<void> => {
  await User.deleteMany({ email });
};
