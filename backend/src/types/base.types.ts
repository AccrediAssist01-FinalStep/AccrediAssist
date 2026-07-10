import { Document, Types } from 'mongoose';

/**
 * Base document interface — all collections inherit these fields (Document 16).
 */
export interface IBaseDocument extends Document {
  _id: Types.ObjectId;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeleteMethods {
  softDelete(updatedBy?: Types.ObjectId): Promise<this>;
  restore(updatedBy?: Types.ObjectId): Promise<this>;
}

export type BaseDocument = IBaseDocument & SoftDeleteMethods;

export interface QueryIncludeDeleted {
  includeDeleted?: boolean;
}
