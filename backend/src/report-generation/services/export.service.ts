import { logger } from '../../utils/logger';
import { docxReportService } from '../docx/services/docx-report.service';
import { ReportExportRequest, ReportExportResult } from '../interfaces/export.interface';

/**
 * Handles PDF/DOCX export.
 * DOCX generation is implemented via the DOCX Report Generator module.
 */
export class ExportService {
  getSupportedFormats(): Array<'pdf' | 'docx'> {
    return ['pdf', 'docx'];
  }

  async export(request: ReportExportRequest): Promise<ReportExportResult> {
    if (request.format === 'docx' && request.pipelineContext) {
      try {
        const result = await docxReportService.generateFromContext(request.pipelineContext);

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

    if (request.format === 'docx') {
      logger.warn('DOCX export requested without pipeline context');
    } else {
      logger.info('Report export planned (not yet implemented)', { format: request.format });
    }

    return {
      format: request.format,
      status: 'not_implemented',
      message:
        request.format === 'docx'
          ? 'Provide pipelineContext to generate DOCX exports.'
          : 'PDF export will be implemented in a future sprint.',
      plannedFileName: request.fileName,
    };
  }
}

export const exportService = new ExportService();
