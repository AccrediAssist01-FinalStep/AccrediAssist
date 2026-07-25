import { Types } from 'mongoose';
import { IBaseDocument } from './base.types';

export interface ISearchHistory extends IBaseDocument {
  userId: Types.ObjectId;
  query: string;
  resultCount: number;
}

export interface CreateSearchHistoryInput {
  userId: string;
  query: string;
  resultCount: number;
}

export interface ISearchHistoryResponse {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  query: string;
  resultCount: number;
  searchedAt: Date;
  createdAt: Date;
}

export interface SearchHistorySort {
  sortBy: 'createdAt' | 'resultCount';
  sortOrder: 'asc' | 'desc';
}
