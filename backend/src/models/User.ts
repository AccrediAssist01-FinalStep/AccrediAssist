import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/user.types';
import { addBaseFields, baseSchemaOptions, USER_ROLES } from './base.model';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      required: [true, 'Role is required'],
    },
    department: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    profileImage: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  baseSchemaOptions,
);

addBaseFields(userSchema);

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isDeleted: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
