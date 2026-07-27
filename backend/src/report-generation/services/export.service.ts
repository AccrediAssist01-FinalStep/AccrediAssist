import { logger } from '../../utils/logger';
import { docxReportService } from '../docx/services/docx-report.service';
import { pdfReportService } from '../pdf/services/pdf-report.service';
import { ReportExportRequest, ReportExportResult } from '../interfaces/export.interface';

/**
 * Handles PDF/DOCX export via dedicated report generator modules.
 */
export class ExportService {
  getSupportedFormats(): Array<'pdf' | 'docx'> {
    return ['pdf', 'docx'];
  }

  async export(request: ReportExportRequest): Promise<ReportExportResult> {
    if (request.pipelineContext) {
      if (request.format === 'docx') {
        return this.exportDocx(request);
      }
      if (request.format === 'pdf') {
        return this.exportPdf(request);
      }
    }

    if (request.format === 'docx' || request.format === 'pdf') {
      logger.warn(`${request.format.toUpperCase()} export requested without pipeline context`);
    } else {
      logger.info('Report export planned (not yet implemented)', { format: request.format });
    }

    return {
      format: request.format,
      status: 'not_implemented',
      message: `Provide pipelineContext to generate ${request.format.toUpperCase()} exports.`,
      plannedFileName: request.fileName,
    };
  }

  private async exportDocx(request: ReportExportRequest): Promise<ReportExportResult> {
    try {
      const result = await docxReportService.generateFromContext(request.pipelineContext!);

      return {
        format: 'docx',
        status: 'completed',
        message: 'DOCX report generated successfully.',
        fileName: result.fileName,
        downloadUrl: result.downloadUrl,
        filePath: result.filePath,
        fileSizeBytes: result.fileSizeBytes,
        sectionsIncluded: result.sectionsIncluded,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'DOCX export failed';
      logger.error('DOCX export failed', { reason });

      return {
        format: 'docx',
        status: 'failed',
        message: reason,
        plannedFileName: request.fileName,
      };
    }
  }

  private async exportPdf(request: ReportExportRequest): Promise<ReportExportResult> {
    try {
      const result = await pdfReportService.generateFromContext(request.pipelineContext!);

      return {
        format: 'pdf',
        status: 'completed',
        message: 'PDF report generated successfully.',
        fileName: result.fileName,
        downloadUrl: result.downloadUrl,
        filePath: result.filePath,
        fileSizeBytes: result.fileSizeBytes,
        sectionsIncluded: result.sectionsIncluded,
        pageCount: result.pageCount,
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'PDF export failed';
      logger.error('PDF export failed', { reason });

      return {
        format: 'pdf',
        status: 'failed',
        message: reason,
        plannedFileName: request.fileName,
      };
    }
  }
}

export const exportService = new ExportService();
