import { Schema, SchemaOptions } from 'mongoose';
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
} as const;

export const baseSchemaOptions: SchemaOptions = {
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

/**
 * Apply base fields and common plugins to a schema.
 */
export const applyBaseSchema = <T extends IBaseDocument>(schema: Schema<T>): Schema<T> => {
  schema.add(baseFieldDefinition);
  schema.plugin(softDeletePlugin);
  return schema;
};

/**
 * Create a new schema with base configuration applied.
 */
export const createBaseSchema = <T extends IBaseDocument>(
  definition: Record<string, unknown>,
  options: SchemaOptions = {},
): Schema<T> => {
  const schema = new Schema<T>(definition, {
    ...baseSchemaOptions,
    ...options,
  });

  return applyBaseSchema(schema);
};

// Backward-compatible exports
export const addBaseFields = applyBaseSchema;

export type { UserRole } from './enums';
export { USER_ROLES } from './enums';
