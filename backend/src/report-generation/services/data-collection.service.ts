import { logger } from '../../utils/logger';
import { GenerationReportType } from '../config/report-types.config';
import { getGenerationReportTypeDefinition } from '../config/report-types.config';
import {
  CollectedReportData,
  ReportDataSection,
  ReportPipelineContext,
} from '../interfaces/report-data.interface';
import { ReportGenerationFilters } from '../interfaces/report-generation.interface';

/**
 * Aggregates institutional data from MongoDB collections.
 * Implementation deferred — returns structured empty sections for now.
 */
export class DataCollectionService {
  async collect(
    reportType: GenerationReportType,
    filters: ReportGenerationFilters,
  ): Promise<CollectedReportData> {
    const definition = getGenerationReportTypeDefinition(reportType);

    logger.info('Report data collection planned (not yet implemented)', {
      reportType,
      dataSources: definition.dataSources,
      filters,
    });

    const sections: ReportDataSection[] = definition.dataSources.map((source) => ({
      key: source,
      label: source,
      collection: source,
      recordCount: 0,
      records: [],
    }));

    return {
      reportType,
      filters,
      collectedAt: new Date(),
      sections,
      totals: {},
    };
  }

  async collectForContext(context: ReportPipelineContext): Promise<ReportPipelineContext> {
    const collectedData = await this.collect(context.reportType, context.filters);
    return { ...context, collectedData };
  }
}

export const dataCollectionService = new DataCollectionService();
