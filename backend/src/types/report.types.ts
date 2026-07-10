import { Types } from 'mongoose';
import { ReportType } from '../database/enums';
import { IBaseDocument } from './base.types';

export interface ReportFiltersApplied {
  startDate?: Date;
  endDate?: Date;
  department?: string;
  category?: string;
  [key: string]: unknown;
}

export interface IReport extends IBaseDocument {
  reportTitle: string;
  reportType: ReportType;
  generatedBy: Types.ObjectId;
  generatedDate: Date;
  fileUrl?: string;
  filtersApplied?: ReportFiltersApplied;
}

export interface CreateReportInput {
  reportTitle: string;
  reportType: ReportType;
  generatedBy: Types.ObjectId;
  generatedDate?: Date;
  fileUrl?: string;
  filtersApplied?: ReportFiltersApplied;
}

export interface UpdateReportInput {
  reportTitle?: string;
  reportType?: ReportType;
  generatedBy?: Types.ObjectId;
  generatedDate?: Date;
  fileUrl?: string;
  filtersApplied?: ReportFiltersApplied;
}

export interface IReportResponse {
  _id: Types.ObjectId;
  reportTitle: string;
  reportType: ReportType;
  generatedBy: Types.ObjectId;
  generatedDate: Date;
  fileUrl?: string;
  filtersApplied?: ReportFiltersApplied;
  downloadReady: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportDownloadResponse {
  reportId: Types.ObjectId;
  reportTitle: string;
  downloadUrl: string;
  fileName: string;
  contentType: string;
  status: 'ready';
}

export interface ReportFilters {
  search?: string;
  reportType?: ReportType;
  generatedBy?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface ReportSort {
  sortBy: 'reportTitle' | 'reportType' | 'generatedDate' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

export interface GenerateReportFilters {
  month?: string;
  year?: number;
  academicYear?: string;
  department?: string;
  startDate?: Date;
  endDate?: Date;
}
