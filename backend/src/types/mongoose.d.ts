import { Types } from 'mongoose';

declare module 'mongoose' {
  interface Document {
    softDelete(updatedBy?: Types.ObjectId): Promise<this>;
    restore(updatedBy?: Types.ObjectId): Promise<this>;
  }

  interface QueryOptions {
    includeDeleted?: boolean;
  }
}

export {};
