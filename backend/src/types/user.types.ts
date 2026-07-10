import { Types } from 'mongoose';
import { IBaseDocument, UserRole } from '../models/base.model';

export interface IUser extends IBaseDocument {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  designation?: string;
  profileImage?: string;
  isActive: boolean;
  lastLogin?: Date;
}

export interface IUserDocument extends IUser {
  _id: Types.ObjectId;
}

export interface IUserResponse {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  designation?: string;
  profileImage?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department?: string;
  designation?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  department?: string;
  designation?: string;
  isActive?: boolean;
}

export type UserDocumentFields = Pick<
  IUser,
  | 'name'
  | 'email'
  | 'password'
  | 'role'
  | 'department'
  | 'designation'
  | 'profileImage'
  | 'isActive'
  | 'lastLogin'
>;
