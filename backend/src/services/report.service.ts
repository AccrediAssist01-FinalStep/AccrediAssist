import { reportRepository } from '../repositories/report.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import {
  GenerateReportFilters,
  IReport,
  IReportResponse,
  ReportDownloadResponse,
  ReportFilters,
  ReportSort,
} from '../types/report.types';
import { toReportResponse } from '../utils/report.mapper';
import { logger } from '../utils/logger';
import { PaginationOptions } from '../database/utils/queryHelpers';
import { PaginatedResult } from '../repositories/base.repository';
import { GenerateReportBody } from '../validations/report.validation';
import { ReportType } from '../database/enums';
import { BadRequestError, NotFoundError } from '../utils/errors';

const buildReportTitle = (reportType: ReportType, filters: GenerateReportFilters): string => {
  const parts = [reportType, 'Report'];

  if (filters.academicYear) {
    parts.push(`(${filters.academicYear})`);
  } else if (filters.month && filters.year) {
    parts.push(`(${filters.month} ${filters.year})`);
  } else if (filters.year) {
    parts.push(`(${filters.year})`);
  }

  if (filters.department) {
    parts.push(`- ${filters.department}`);
  }

  return parts.join(' ');
};

const extractFiltersApplied = (input: GenerateReportBody): GenerateReportFilters => {
  const filters: GenerateReportFilters = {};

  if (input.month) filters.month = input.month;
  if (input.year) filters.year = input.year;
  if (input.academicYear) filters.academicYear = input.academicYear;
  if (input.department) filters.department = input.department;
  if (input.startDate) filters.startDate = input.startDate;
  if (input.endDate) filters.endDate = input.endDate;

  return filters;
};

const buildDownloadFileName = (reportTitle: string, fileUrl: string): string => {
  const extensionMatch = fileUrl.match(/\.(pdf|docx)(?:\?|$)/i);
  const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'pdf';
  const safeTitle = reportTitle
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 120);

  return `${safeTitle || 'report'}.${extension}`;
};

const resolveContentType = (fileUrl: string): string => {
  if (/\.docx(?:\?|$)/i.test(fileUrl)) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  return 'application/pdf';
};

export class ReportService {
  async generateReport(input: GenerateReportBody, userId: string): Promise<IReportResponse> {
    const filtersApplied = extractFiltersApplied(input);
    const reportTitle = buildReportTitle(input.reportType, filtersApplied);

    logger.info('Report generation requested (placeholder)', {
      reportType: input.reportType,
      userId,
      filtersApplied,
    });

    const report = await reportRepository.create(
      {
        reportTitle,
        reportType: input.reportType,
        generatedBy: userId,
        generatedDate: new Date(),
        filtersApplied,
      } as Partial<IReport>,
      userId,
    );

    await auditLogRepository.create({
      userId,
      action: 'CREATE',
      module: 'Report',
      description: `Report generation requested: ${reportTitle}`,
    });

    return toReportResponse(report);
  }

  async listReports(
    filters: ReportFilters,
    pagination: PaginationOptions,
    sort: ReportSort,
  ): Promise<PaginatedResult<IReportResponse>> {
    logger.info('Listing report history', { filters, pagination, sort });

    const result = await reportRepository.findWithFilters(filters, pagination, sort);

    return {
      items: result.items.map((record) => toReportResponse(record)),
      meta: result.meta,
    };
  }

  async getReportById(id: string): Promise<IReportResponse> {
    const report = await reportRepository.findById(id);
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    return toReportResponse(report);
  }

  async getDownloadInfo(id: string): Promise<ReportDownloadResponse> {
    const report = await reportRepository.findById(id);
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (!report.fileUrl) {
      throw new BadRequestError(
        'Report file is not available yet. AI generation has not been completed.',
      );
    }

    return {
      reportId: report._id,
      reportTitle: report.reportTitle,
      downloadUrl: report.fileUrl,
      fileName: buildDownloadFileName(report.reportTitle, report.fileUrl),
      contentType: resolveContentType(report.fileUrl),
      status: 'ready',
    };
  }
}

export const reportService = new ReportService();
