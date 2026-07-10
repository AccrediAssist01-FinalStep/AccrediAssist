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
