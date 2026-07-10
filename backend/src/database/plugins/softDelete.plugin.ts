import { Schema, Query, Types } from 'mongoose';
import { IBaseDocument, QueryIncludeDeleted } from '../../types/base.types';

type SoftDeleteQuery<T> = Query<T, IBaseDocument> & QueryIncludeDeleted;

/**
 * Mongoose plugin: auto-excludes soft-deleted documents from queries
 * unless `{ includeDeleted: true }` is passed in query options.
 */
export const softDeletePlugin = (schema: Schema): void => {
  const excludeDeleted = function (this: SoftDeleteQuery<unknown>) {
    const options = this.getOptions();

    if (!options?.includeDeleted) {
      this.where({ isDeleted: { $ne: true } });
    }
  };

  schema.pre('find', excludeDeleted);
  schema.pre('findOne', excludeDeleted);
  schema.pre('findOneAndUpdate', excludeDeleted);
  schema.pre('countDocuments', excludeDeleted);

  schema.methods.softDelete = async function (
    this: IBaseDocument,
    updatedBy?: Types.ObjectId,
  ) {
    this.isDeleted = true;
    if (updatedBy) {
      this.updatedBy = updatedBy;
    }
    return this.save();
  };

  schema.methods.restore = async function (
    this: IBaseDocument,
    updatedBy?: Types.ObjectId,
  ) {
    this.isDeleted = false;
    if (updatedBy) {
      this.updatedBy = updatedBy;
    }
    return this.save();
  };
};
