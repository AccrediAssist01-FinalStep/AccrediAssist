import { logger } from '../../utils/logger';
import { chartService } from '../charts/services/chart.service';
import { ReportPipelineContext, PreparedChart } from '../interfaces/report-data.interface';

/**
 * Builds chart datasets from aggregated MongoDB data via the Charts & Analytics Engine.
 */
export class ChartPreparationService {
  async prepare(context: ReportPipelineContext): Promise<PreparedChart[]> {
    const aggregation = context.collectedData?.aggregation;

    if (!aggregation) {
      logger.warn('Chart preparation skipped — no aggregated data in pipeline context', {
        reportType: context.reportType,
      });
      return [];
    }

    const result = chartService.generateForReportType(context.reportType, aggregation);
    const prepared = chartService.toPreparedCharts(result.charts);

    logger.info('Charts prepared for report pipeline', {
      reportType: context.reportType,
      chartCount: prepared.length,
      fromCache: result.fromCache,
    });

    return prepared;
  }

  async prepareForContext(context: ReportPipelineContext): Promise<ReportPipelineContext> {
    const charts = await this.prepare(context);
    return { ...context, charts };
  }
}

export const chartPreparationService = new ChartPreparationService();
