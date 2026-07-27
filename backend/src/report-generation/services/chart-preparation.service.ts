import { logger } from '../../utils/logger';
import { ReportPipelineContext, PreparedChart } from '../interfaces/report-data.interface';

/**
 * Builds chart datasets from collected report data.
 * Implementation deferred — returns empty chart definitions.
 */
export class ChartPreparationService {
  async prepare(context: ReportPipelineContext): Promise<PreparedChart[]> {
    logger.info('Chart preparation planned (not yet implemented)', {
      reportType: context.reportType,
    });

    return [];
  }

  async prepareForContext(context: ReportPipelineContext): Promise<ReportPipelineContext> {
    const charts = await this.prepare(context);
    return { ...context, charts };
  }
}

export const chartPreparationService = new ChartPreparationService();
