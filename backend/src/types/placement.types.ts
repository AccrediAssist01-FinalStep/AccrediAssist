import { Types } from 'mongoose';
import { IBaseDocument } from './base.types';

export interface IPlacement extends IBaseDocument {
  studentName: string;
  rollNumber?: string;
  department?: string;
  company: string;
  role?: string;
  package?: string;
  joiningDate?: Date;
  offerLetter?: string;
  approvedBy?: Types.ObjectId;
}

export interface CreatePlacementInput {
  studentName: string;
  rollNumber?: string;
  department?: string;
  company: string;
  role?: string;
  package?: string;
  joiningDate?: Date;
  offerLetter?: string;
  approvedBy?: Types.ObjectId;
}

export interface UpdatePlacementInput {
  studentName?: string;
  rollNumber?: string;
  department?: string;
  company?: string;
  role?: string;
  package?: string;
  joiningDate?: Date;
  offerLetter?: string;
  approvedBy?: Types.ObjectId;
}

export interface IPlacementResponse {
  _id: Types.ObjectId;
  studentName: string;
  rollNumber?: string;
  department?: string;
  company: string;
  role?: string;
  package?: string;
  joiningDate?: Date;
  offerLetter?: string;
  approvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlacementFilters {
  search?: string;
  company?: string;
  department?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface PlacementSort {
  sortBy: 'studentName' | 'company' | 'department' | 'joiningDate' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
