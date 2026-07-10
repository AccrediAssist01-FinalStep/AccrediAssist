import { Types } from 'mongoose';
import { IBaseDocument } from './base.types';

export interface IPlacement extends IBaseDocument {
  studentName: string;
  rollNumber?: string;
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
  company?: string;
  role?: string;
  package?: string;
  joiningDate?: Date;
  offerLetter?: string;
  approvedBy?: Types.ObjectId;
}
