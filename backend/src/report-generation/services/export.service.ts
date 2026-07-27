import { logger } from '../../utils/logger';
import { ReportExportRequest, ReportExportResult } from '../interfaces/export.interface';

/**
 * Handles PDF/DOCX export.
 * Intentionally not implemented — architecture placeholder only.
 */
export class ExportService {
  getSupportedFormats(): Array<'pdf' | 'docx'> {
    return ['pdf', 'docx'];
  }

  async export(request: ReportExportRequest): Promise<ReportExportResult> {
    logger.info('Report export planned (not yet implemented)', { format: request.format });

    return {
      format: request.format,
      status: 'not_implemented',
      message: 'PDF and DOCX export will be implemented in a future sprint.',
      plannedFileName: request.fileName,
    };
  }
}

export const exportService = new ExportService();
