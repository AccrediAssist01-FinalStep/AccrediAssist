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
