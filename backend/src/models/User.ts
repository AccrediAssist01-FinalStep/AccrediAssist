import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types/user.types';
import { addBaseFields, baseSchemaOptions, USER_ROLES } from './base.model';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [255, 'Email cannot exceed 255 characters'],
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      maxlength: [128, 'Password cannot exceed 128 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: '{VALUE} is not a valid role',
      },
      required: [true, 'Role is required'],
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Department cannot exceed 100 characters'],
    },
    designation: {
      type: String,
      trim: true,
      maxlength: [100, 'Designation cannot exceed 100 characters'],
    },
    profileImage: {
      type: String,
      trim: true,
      validate: {
        validator: (value: string) => !value || /^https?:\/\/.+/.test(value),
        message: 'Profile image must be a valid URL',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    ...baseSchemaOptions,
    collection: 'users',
  },
);

addBaseFields(userSchema);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ isActive: 1 });

export const User = mongoose.model<IUser>('User', userSchema);
