import mongoose, { Schema } from 'mongoose';
import { ISearchHistory } from '../types/searchHistory.types';
import { applyBaseSchema, baseSchemaOptions } from '../database';

const searchHistorySchema = new Schema<ISearchHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    query: {
      type: String,
      required: [true, 'Search query is required'],
      trim: true,
      maxlength: [500, 'Search query cannot exceed 500 characters'],
    },
    resultCount: {
      type: Number,
      required: [true, 'Result count is required'],
      min: [0, 'Result count cannot be negative'],
    },
  },
  {
    ...baseSchemaOptions,
    collection: 'search_history',
  },
);

applyBaseSchema(searchHistorySchema);

searchHistorySchema.index({ userId: 1, createdAt: -1 });

export const SearchHistory = mongoose.model<ISearchHistory>('SearchHistory', searchHistorySchema);
