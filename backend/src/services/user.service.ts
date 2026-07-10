import { userRepository } from '../repositories/user.repository';
import { hashPassword } from '../utils/password';
import { AppError } from '../utils/AppError';
import { CreateUserInput } from '../validations/auth.validation';
import { IUser, IUserResponse } from '../types/user.types';
import { logger } from '../utils/logger';

const toUserResponse = (user: IUser): IUserResponse => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  designation: user.designation,
  profileImage: user.profileImage,
  isActive: user.isActive,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export class UserService {
  async createUser(input: CreateUserInput): Promise<IUserResponse> {
    const existingUser = await userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    const hashedPassword = await hashPassword(input.password);

    try {
      const user = await userRepository.create({
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: input.role,
        department: input.department,
        designation: input.designation,
      });

      logger.info('User registered successfully', { email: user.email, role: user.role });

      return toUserResponse(user);
    } catch (error) {
      if (error instanceof Error && 'code' in error && (error as { code: number }).code === 11000) {
        throw new AppError('User with this email already exists', 409);
      }

      throw error;
    }
  }
}

export const userService = new UserService();
