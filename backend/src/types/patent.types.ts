import { PatentStatus } from '../database/enums';
import { Types } from 'mongoose';
import { IBaseDocument } from './base.types';

export interface IPatent extends IBaseDocument {
  patentTitle: string;
  inventors: string[];
  patentNumber?: string;
  status: PatentStatus;
  filingDate?: Date;
  documentUrl?: string;
}

export interface CreatePatentInput {
  patentTitle: string;
  inventors?: string[];
  patentNumber?: string;
  status: PatentStatus;
  filingDate?: Date;
  documentUrl?: string;
}

export interface UpdatePatentInput {
  patentTitle?: string;
  inventors?: string[];
  patentNumber?: string;
  status?: PatentStatus;
  filingDate?: Date;
  documentUrl?: string;
}

export interface IPatentResponse {
  _id: Types.ObjectId;
  patentTitle: string;
  inventors: string[];
  patentNumber?: string;
  status: PatentStatus;
  filingDate?: Date;
  documentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatentFilters {
  search?: string;
  status?: PatentStatus;
  patentNumber?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface PatentSort {
  sortBy: 'patentTitle' | 'status' | 'filingDate' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
