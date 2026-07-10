import { userRepository } from '../repositories/user.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { LoginInput } from '../validations/auth.validation';
import { IUserResponse } from '../types/user.types';
import { toUserResponse } from '../utils/user.mapper';

export class AuthService {
  async login(input: LoginInput, ipAddress?: string) {
    const user = await userRepository.findByEmail(input.email, true);

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated', 403);
    }

    const isPasswordValid = await comparePassword(input.password, user.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    await userRepository.updateLastLogin(user._id.toString());

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await auditLogRepository.create({
      userId: user._id.toString(),
      action: 'LOGIN',
      module: 'Auth',
      description: `User ${user.email} logged in successfully`,
      ipAddress,
    });

    const userWithoutPassword = await userRepository.findById(user._id.toString());

    if (!userWithoutPassword) {
      throw new AppError('User not found', 404);
    }

    return {
      token,
      user: toUserResponse(userWithoutPassword),
    };
  }

  async getProfile(userId: string): Promise<IUserResponse> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return toUserResponse(user);
  }
}

export const authService = new AuthService();
