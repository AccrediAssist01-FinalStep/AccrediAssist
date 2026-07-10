import { User } from '../models/User';
import { IUser, CreateUserInput, UpdateUserInput } from '../types/user.types';

export class UserRepository {
  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = User.findOne({ email: email.toLowerCase(), isDeleted: false });
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findOne({ _id: id, isDeleted: false }).exec();
  }

  async findAll(): Promise<IUser[]> {
    return User.find({ isDeleted: false }).sort({ createdAt: -1 }).exec();
  }

  async create(data: CreateUserInput, createdBy?: string): Promise<IUser> {
    const user = new User({
      ...data,
      email: data.email.toLowerCase(),
      createdBy,
    });
    return user.save();
  }

  async update(id: string, data: UpdateUserInput, updatedBy?: string): Promise<IUser | null> {
    const updateData: Record<string, unknown> = { ...data, updatedBy };
    if (data.email) {
      updateData.email = data.email.toLowerCase();
    }
    return User.findOneAndUpdate({ _id: id, isDeleted: false }, updateData, {
      new: true,
      runValidators: true,
    }).exec();
  }

  async softDelete(id: string, updatedBy?: string): Promise<IUser | null> {
    return User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, isActive: false, updatedBy },
      { new: true },
    ).exec();
  }

  async updateLastLogin(id: string): Promise<void> {
    await User.findByIdAndUpdate(id, { lastLogin: new Date() }).exec();
  }
}

export const userRepository = new UserRepository();
