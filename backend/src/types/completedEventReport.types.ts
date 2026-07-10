import { Types } from 'mongoose';
import { EventType } from '../database/enums';
import { IBaseDocument } from './base.types';

export interface ICompletedEventReport extends IBaseDocument {
  eventTitle: string;
  eventType: EventType;
  date?: Date;
  venue?: string;
  coordinator?: string;
  participants?: number;
  summary?: string;
  description?: string;
  photoUrls: string[];
  generatedReportUrl?: string;
  approvedBy?: Types.ObjectId;
}

export interface CreateCompletedEventReportInput {
  eventTitle: string;
  eventType: EventType;
  date?: Date;
  venue?: string;
  coordinator?: string;
  participants?: number;
  summary?: string;
  description?: string;
  photoUrls?: string[];
  generatedReportUrl?: string;
  approvedBy?: Types.ObjectId;
}

export interface UpdateCompletedEventReportInput {
  eventTitle?: string;
  eventType?: EventType;
  date?: Date;
  venue?: string;
  coordinator?: string;
  participants?: number;
  summary?: string;
  description?: string;
  photoUrls?: string[];
  generatedReportUrl?: string;
  approvedBy?: Types.ObjectId;
}

export interface ICompletedEventReportResponse {
  _id: Types.ObjectId;
  eventTitle: string;
  eventType: EventType;
  date?: Date;
  venue?: string;
  coordinator?: string;
  participants?: number;
  summary?: string;
  description?: string;
  photoUrls: string[];
  generatedReportUrl?: string;
  approvedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompletedEventReportFilters {
  search?: string;
  eventType?: EventType;
  eventTitle?: string;
  coordinator?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface CompletedEventReportSort {
  sortBy: 'eventTitle' | 'eventType' | 'date' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}
