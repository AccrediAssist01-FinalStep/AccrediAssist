import { Types } from 'mongoose';
import { IUser, IUserResponse } from '../types/user.types';

export const toUserResponse = (user: IUser): IUserResponse => ({
  _id: user._id as Types.ObjectId,
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
