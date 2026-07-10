import { FilterQuery, Model, Types, UpdateQuery } from 'mongoose';
import { IBaseDocument } from '../../types/base.types';

type BaseModel<T extends IBaseDocument> = Model<T>;

/**
 * Soft-delete a document by ID.
 */
export const softDeleteById = async <T extends IBaseDocument>(
  model: BaseModel<T>,
  id: string,
  updatedBy?: string,
): Promise<T | null> => {
  const update: UpdateQuery<T> = {
    isDeleted: true,
    ...(updatedBy ? { updatedBy: new Types.ObjectId(updatedBy) } : {}),
  };

  return model
    .findOneAndUpdate({ _id: id, isDeleted: { $ne: true } }, update, { new: true })
    .setOptions({ includeDeleted: true })
    .exec();
};

/**
 * Restore a soft-deleted document by ID.
 */
export const restoreById = async <T extends IBaseDocument>(
  model: BaseModel<T>,
  id: string,
  updatedBy?: string,
): Promise<T | null> => {
  const update: UpdateQuery<T> = {
    isDeleted: false,
    ...(updatedBy ? { updatedBy: new Types.ObjectId(updatedBy) } : {}),
  };

  return model
    .findOneAndUpdate({ _id: id, isDeleted: true }, update, { new: true })
    .setOptions({ includeDeleted: true })
    .exec();
};

/**
 * Build a filter that excludes soft-deleted records.
 */
export const activeOnlyFilter = <T extends IBaseDocument>(): FilterQuery<T> => ({
  isDeleted: { $ne: true },
});

/**
 * Build a filter for soft-deleted records only.
 */
export const deletedOnlyFilter = <T extends IBaseDocument>(): FilterQuery<T> => ({
  isDeleted: true,
});
