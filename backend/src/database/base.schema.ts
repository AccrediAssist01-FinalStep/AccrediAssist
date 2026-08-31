import { Schema } from 'mongoose';
import type { SchemaOptions } from 'mongoose';
import { IBaseDocument } from '../types/base.types';
import { softDeletePlugin } from './plugins/softDelete.plugin';

export const baseFieldDefinition = {
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: undefined,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: undefined,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
};

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
  toObject: {
    virtuals: true,
  },
};

export const applyBaseSchema = <T extends IBaseDocument>(schema: Schema<T>): Schema<T> => {
  (schema as unknown as Schema).add(baseFieldDefinition as never);
  (schema as unknown as Schema).plugin(softDeletePlugin);
  return schema;
};

export const createBaseSchema = <T extends IBaseDocument>(
  definition: Record<string, unknown>,
  options: SchemaOptions = {},
): Schema<T> => {
  const mergedOptions = {
    ...baseSchemaOptions,
    ...options,
  } as unknown as SchemaOptions;

  const schema = new Schema<T>(definition as never, mergedOptions as never);

  return applyBaseSchema(schema);
};

export const addBaseFields = applyBaseSchema;

export type { UserRole } from './enums';
export { USER_ROLES } from './enums';
