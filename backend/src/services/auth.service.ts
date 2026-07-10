import { userRepository } from '../repositories/user.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { LoginInput, CreateUserInput, UpdateUserInput } from '../validations/auth.validation';
import { IUserResponse } from '../types/user.types';

const toUserResponse = (user: {
  _id: { toString: () => string };
  name: string;
  email: string;
  role: IUserResponse['role'];
  department?: string;
  designation?: string;
  profileImage?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}): IUserResponse => ({
  _id: user._id as unknown as IUserResponse['_id'],
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

  async logout(userId: string, ipAddress?: string) {
    await auditLogRepository.create({
      userId,
      action: 'LOGOUT',
      module: 'Auth',
      description: 'User logged out',
      ipAddress,
    });
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return toUserResponse(user);
  }
}

export class UserService {
  async getAllUsers() {
    const users = await userRepository.findAll();
    return users.map(toUserResponse);
  }

  async getUserById(id: string) {
    const user = await userRepository.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return toUserResponse(user);
  }

  async createUser(input: CreateUserInput, createdBy: string) {
    const existingUser = await userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await userRepository.create(
      {
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: input.role,
        department: input.department,
        designation: input.designation,
      },
      createdBy,
    );

    await auditLogRepository.create({
      userId: createdBy,
      action: 'USER_CREATED',
      module: 'Users',
      description: `Created user ${user.email} with role ${user.role}`,
      relatedRecordId: user._id.toString(),
    });

    return toUserResponse(user);
  }

  async updateUser(id: string, input: UpdateUserInput, updatedBy: string) {
    const existingUser = await userRepository.findById(id);

    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    if (input.email && input.email !== existingUser.email) {
      const emailTaken = await userRepository.findByEmail(input.email);
      if (emailTaken) {
        throw new AppError('Email is already in use', 409);
      }
    }

    const updateData = { ...input };

    if (input.password) {
      updateData.password = await hashPassword(input.password);
    }

    const user = await userRepository.update(id, updateData, updatedBy);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await auditLogRepository.create({
      userId: updatedBy,
      action: 'USER_UPDATED',
      module: 'Users',
      description: `Updated user ${user.email}`,
      relatedRecordId: user._id.toString(),
    });

    return toUserResponse(user);
  }

  async deleteUser(id: string, deletedBy: string) {
    const user = await userRepository.softDelete(id, deletedBy);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await auditLogRepository.create({
      userId: deletedBy,
      action: 'USER_DELETED',
      module: 'Users',
      description: `Soft deleted user ${user.email}`,
      relatedRecordId: user._id.toString(),
    });

    return toUserResponse(user);
  }
}

export const authService = new AuthService();
export const userService = new UserService();
