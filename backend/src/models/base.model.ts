import { Schema, Document, Types } from 'mongoose';

export type UserRole = 'Admin' | 'HOD' | 'Faculty' | 'AccreditationCommittee';

export interface IBaseDocument extends Document {
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const baseSchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    },
  },
};

export const addBaseFields = (schema: Schema): void => {
  schema.add({
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
  });
};

export const USER_ROLES: UserRole[] = ['Admin', 'HOD', 'Faculty', 'AccreditationCommittee'];
