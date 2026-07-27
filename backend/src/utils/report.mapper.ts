import { IReport, IReportResponse } from '../types/report.types';

const buildDownloadPath = (reportId: string): string =>
  `/api/v1/reports/download/${reportId}`;

const isDownloadReady = (record: IReport): boolean => {
  if (record.status === 'failed' || record.status === 'generating') {
    return false;
  }

  return Boolean(record.filePath || record.fileUrl);
};

export const toReportResponse = (record: IReport): IReportResponse => {
  const downloadReady = isDownloadReady(record);

  return {
    _id: record._id,
    reportTitle: record.reportTitle,
    reportType: record.reportType,
    generatedBy: record.generatedBy,
    generatedDate: record.generatedDate,
    fileUrl: record.fileUrl,
    filePath: record.filePath,
    fileName: record.fileName,
    exportFormat: record.exportFormat,
    status: record.status,
    fileSizeBytes: record.fileSizeBytes,
    pageCount: record.pageCount,
    sectionsIncluded: record.sectionsIncluded,
    errorMessage: record.errorMessage,
    filtersApplied: record.filtersApplied,
    downloadReady,
    downloadUrl: downloadReady
      ? record.filePath
        ? buildDownloadPath(String(record._id))
        : record.fileUrl
      : undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
};
