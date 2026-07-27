import fs from 'fs/promises';
import path from 'path';
import { reportRepository } from '../repositories/report.repository';
import { auditLogRepository } from '../repositories/auditLog.repository';
import {
  GenerateReportFilters,
  IReport,
  IReportResponse,
  ReportDownloadResponse,
  ReportFilters,
  ReportSort,
  ReportStreamInfo,
} from '../types/report.types';
import { toReportResponse } from '../utils/report.mapper';
import { logger } from '../utils/logger';
import { PaginationOptions } from '../database/utils/queryHelpers';
import { PaginatedResult } from '../repositories/base.repository';
import { GenerateReportBody } from '../validations/report.validation';
import { ReportExportFormat, ReportType } from '../database/enums';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { isGenerationReportType, parseGenerationReportType } from '../report-generation/utils/report-type.util';
import { buildReportTitle } from '../report-generation/utils/report-context.util';
import { reportGenerationOrchestrator } from './report-generation-orchestrator.service';
import { docxReportService } from '../report-generation/docx/services/docx-report.service';
import { pdfReportService } from '../report-generation/pdf/services/pdf-report.service';
import { isAllowedExternalDownloadUrl } from '../report-generation/utils/filter-mapper.util';

const buildLegacyReportTitle = (reportType: ReportType, filters: GenerateReportFilters): string => {
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

const buildDownloadFileName = (
  reportTitle: string,
  exportFormat?: ReportExportFormat,
  fileName?: string,
  fileUrl?: string,
): string => {
  if (fileName) {
    return fileName;
  }

  const extensionMatch = fileUrl?.match(/\.(pdf|docx)(?:\?|$)/i);
  const extension = exportFormat ?? (extensionMatch ? extensionMatch[1].toLowerCase() : 'pdf');
  const safeTitle = reportTitle
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 120);

  return `${safeTitle || 'report'}.${extension}`;
};

const resolveContentType = (exportFormat?: ReportExportFormat, fileUrl?: string): string => {
  if (exportFormat === 'docx' || /\.docx(?:\?|$)/i.test(fileUrl ?? '')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  return 'application/pdf';
};

const resolveReportTitle = (reportType: ReportType, filters: GenerateReportFilters): string => {
  if (isGenerationReportType(reportType)) {
    return buildReportTitle(reportType, filters);
  }

  return buildLegacyReportTitle(reportType, filters);
};

const resolveLocalFilePath = async (report: IReport): Promise<string | null> => {
  if (report.filePath) {
    try {
      await fs.access(report.filePath);
      return report.filePath;
    } catch {
      // fall through to fileName lookup
    }
  }

  if (report.fileName) {
    const docxPath = docxReportService.resolveExportPath(report.fileName);
    try {
      await fs.access(docxPath);
      return docxPath;
    } catch {
      // continue
    }

    const pdfPath = pdfReportService.resolveExportPath(report.fileName);
    try {
      await fs.access(pdfPath);
      return pdfPath;
    } catch {
      return null;
    }
  }

  return null;
};

const deleteLocalReportFile = async (report: IReport): Promise<void> => {
  const localPath = await resolveLocalFilePath(report);
  if (!localPath) return;

  try {
    await fs.unlink(localPath);
    logger.info('Report export file deleted', { reportId: report._id, localPath });
  } catch (error) {
    logger.warn('Failed to delete report export file', {
      reportId: report._id,
      localPath,
      reason: error instanceof Error ? error.message : 'unknown',
    });
  }
};

export class ReportService {
  async generateReport(input: GenerateReportBody, userId: string): Promise<IReportResponse> {
    const filtersApplied = extractFiltersApplied(input);
    const reportTitle = resolveReportTitle(input.reportType, filtersApplied);
    const shouldGenerateFile = Boolean(input.format);

    if (shouldGenerateFile && !isGenerationReportType(input.reportType)) {
      throw new BadRequestError(
        `Report type "${input.reportType}" does not support PDF/DOCX generation. Supported types: NBA, NAAC, AICTE, Placement, Internship, Student Achievement, Faculty Achievement, Publication, Patent, Completed Event.`,
      );
    }

    if (shouldGenerateFile) {
      return this.generateReportWithFile(input, userId, filtersApplied, reportTitle);
    }

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
        status: 'pending',
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

  private async generateReportWithFile(
    input: GenerateReportBody,
    userId: string,
    filtersApplied: GenerateReportFilters,
    reportTitle: string,
  ): Promise<IReportResponse> {
    const format = input.format as ReportExportFormat;
    const generationReportType = parseGenerationReportType(input.reportType);

    logger.info('Report file generation started', {
      reportType: input.reportType,
      format,
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
        exportFormat: format,
        status: 'generating',
      } as Partial<IReport>,
      userId,
    );

    try {
      const generated = await reportGenerationOrchestrator.generateFile(
        generationReportType,
        filtersApplied,
        format,
      );

      const updated = await reportRepository.update(
        String(report._id),
        {
          status: 'completed',
          filePath: generated.filePath,
          fileName: generated.fileName,
          fileSizeBytes: generated.fileSizeBytes,
          pageCount: generated.pageCount,
          sectionsIncluded: generated.sectionsIncluded,
          errorMessage: undefined,
        } as Partial<IReport>,
        userId,
      );

      if (!updated) {
        throw new NotFoundError('Report not found after generation');
      }

      await auditLogRepository.create({
        userId,
        action: 'CREATE',
        module: 'Report',
        description: `Report generated (${format.toUpperCase()}): ${reportTitle}`,
      });

      logger.info('Report file generation completed', {
        reportId: updated._id,
        format,
        fileName: generated.fileName,
        fileSizeBytes: generated.fileSizeBytes,
      });

      return toReportResponse(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Report generation failed';

      await reportRepository.update(
        String(report._id),
        {
          status: 'failed',
          errorMessage: message,
        } as Partial<IReport>,
        userId,
      );

      throw error;
    }
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

    if (report.status === 'generating') {
      throw new BadRequestError('Report is still being generated. Please try again shortly.');
    }

    if (report.status === 'failed') {
      throw new BadRequestError(
        report.errorMessage ?? 'Report generation failed. Please regenerate the report.',
      );
    }

    const localFilePath = await resolveLocalFilePath(report);
    const hasRemoteUrl = Boolean(report.fileUrl);

    if (!localFilePath && !hasRemoteUrl) {
      throw new BadRequestError(
        'Report file is not available yet. Generation has not been completed.',
      );
    }

    const downloadUrl = localFilePath
      ? `/api/v1/reports/download/${report._id}`
      : report.fileUrl!;

    if (!localFilePath && report.fileUrl && !isAllowedExternalDownloadUrl(report.fileUrl)) {
      throw new BadRequestError(
        'External download URL is not from a trusted provider. Contact an administrator.',
      );
    }

    return {
      reportId: report._id,
      reportTitle: report.reportTitle,
      downloadUrl,
      fileName: buildDownloadFileName(
        report.reportTitle,
        report.exportFormat,
        report.fileName,
        report.fileUrl,
      ),
      contentType: resolveContentType(report.exportFormat, report.fileUrl),
      status: 'ready',
      exportFormat: report.exportFormat,
      fileSizeBytes: report.fileSizeBytes,
    };
  }

  async getStreamInfo(id: string): Promise<ReportStreamInfo> {
    const report = await reportRepository.findById(id);
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.status === 'generating') {
      throw new BadRequestError('Report is still being generated. Please try again shortly.');
    }

    if (report.status === 'failed') {
      throw new BadRequestError(
        report.errorMessage ?? 'Report generation failed. Please regenerate the report.',
      );
    }

    const localFilePath = await resolveLocalFilePath(report);
    if (!localFilePath) {
      if (report.fileUrl) {
        throw new BadRequestError(
          'This report is hosted externally. Use the download metadata endpoint with ?redirect=true.',
        );
      }

      throw new BadRequestError('Report file is not available for download.');
    }

    return {
      filePath: localFilePath,
      fileName: buildDownloadFileName(
        report.reportTitle,
        report.exportFormat,
        report.fileName ?? path.basename(localFilePath),
        report.fileUrl,
      ),
      contentType: resolveContentType(
        report.exportFormat,
        report.fileName ?? localFilePath,
      ),
    };
  }

  async deleteReport(id: string, userId: string): Promise<void> {
    const report = await reportRepository.findById(id);
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    await reportRepository.softDelete(id, userId);
    await deleteLocalReportFile(report);

    await auditLogRepository.create({
      userId,
      action: 'DELETE',
      module: 'Report',
      description: `Report deleted: ${report.reportTitle}`,
    });

    logger.info('Report soft-deleted', { reportId: id, userId });
  }
}

export const reportService = new ReportService();
