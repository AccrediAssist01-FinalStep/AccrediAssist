import { Types } from 'mongoose';
import { IBaseDocument } from './base.types';

export interface IInternship extends IBaseDocument {
  studentName: string;
  rollNumber?: string;
  company: string;
  role?: string;
  duration?: string;
  startDate?: Date;
  endDate?: Date;
  certificateUrl?: string;
  approvedBy?: Types.ObjectId;
}

export interface CreateInternshipInput {
  studentName: string;
  rollNumber?: string;
  company: string;
  role?: string;
  duration?: string;
  startDate?: Date;
  endDate?: Date;
  certificateUrl?: string;
  approvedBy?: Types.ObjectId;
}

export interface UpdateInternshipInput {
  studentName?: string;
  rollNumber?: string;
  company?: string;
  role?: string;
  duration?: string;
  startDate?: Date;
  endDate?: Date;
  certificateUrl?: string;
  approvedBy?: Types.ObjectId;
}

export interface IInternshipResponse {
  _id: Types.ObjectId;
  studentName: string;
  rollNumber?: string;
  company: string;
  role?: string;
  duration?: string;
  startDate?: Date;
  endDate?: Date;
  certificateUrl?: string;
  approvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface InternshipFilters {
  search?: string;
  company?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface InternshipSort {
  sortBy: 'studentName' | 'company' | 'startDate' | 'endDate' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
