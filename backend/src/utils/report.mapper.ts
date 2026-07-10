import { IReport, IReportResponse } from '../types/report.types';

export const toReportResponse = (record: IReport): IReportResponse => ({
  _id: record._id,
  reportTitle: record.reportTitle,
  reportType: record.reportType,
  generatedBy: record.generatedBy,
  generatedDate: record.generatedDate,
  fileUrl: record.fileUrl,
  filtersApplied: record.filtersApplied,
  downloadReady: Boolean(record.fileUrl),
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
});
