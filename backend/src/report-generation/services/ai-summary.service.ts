import { logger } from '../../utils/logger';
import { executiveSummaryService } from '../summary/services/executive-summary.service';
import { ReportPipelineContext, ReportAiSummary } from '../interfaces/report-data.interface';

const mapToReportAiSummary = (
  summary: Awaited<ReturnType<typeof executiveSummaryService.generate>>['summary'],
): ReportAiSummary => ({
  executiveSummary: summary.executiveSummary,
  strengths: summary.strengths,
  observations: summary.observations,
  recommendations: summary.recommendations,
  keyHighlights: summary.keyHighlights,
  model: summary.model,
  generatedAt: summary.generatedAt,
  source: summary.source,
});

/**
 * Generates AI executive summaries via Gemini using aggregated MongoDB data.
 */
export class AiSummaryService {
  isAvailable(): boolean {
    return executiveSummaryService.isAvailable();
  }

  async summarize(context: ReportPipelineContext): Promise<ReportAiSummary> {
    const aggregation = context.collectedData?.aggregation;

    if (!aggregation) {
      logger.warn('AI summary skipped — no aggregated data in pipeline context', {
        reportType: context.reportType,
      });

      return {
        executiveSummary:
          'Executive summary could not be generated because aggregated report data is unavailable.',
        strengths: [],
        observations: [],
        recommendations: [],
        keyHighlights: [],
        generatedAt: new Date(),
        source: 'fallback',
      };
    }

    const result = await executiveSummaryService.generate(context.reportType, aggregation);

    logger.info('AI executive summary completed', {
      reportType: context.reportType,
      source: result.summary.source,
      usedFallback: result.usedFallback,
    });

    return mapToReportAiSummary(result.summary);
  }

  async summarizeForContext(context: ReportPipelineContext): Promise<ReportPipelineContext> {
    const aiSummary = await this.summarize(context);
    return { ...context, aiSummary };
  }
}

export const aiSummaryService = new AiSummaryService();
