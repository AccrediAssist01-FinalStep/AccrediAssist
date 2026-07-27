import { logger } from '../../utils/logger';
import { aggregationService } from '../aggregation/services/aggregation.service';
import { mapDataSourceToModuleKey } from '../aggregation/config/module-aggregation.config';
import type { AggregationFilters } from '../aggregation/interfaces/aggregation.interface';
import { GenerationReportType } from '../config/report-types.config';
import { getGenerationReportTypeDefinition } from '../config/report-types.config';
import {
  CollectedReportData,
  ReportDataSection,
  ReportPipelineContext,
} from '../interfaces/report-data.interface';
import { ReportGenerationFilters } from '../interfaces/report-generation.interface';

const mapToAggregationFilters = (filters: ReportGenerationFilters): AggregationFilters => ({
  department: filters.department,
  academicYear: filters.academicYear,
  startDate: filters.startDate,
  endDate: filters.endDate,
});

/** Maps report-generation filters to aggregation module keys from type definition */
const resolveModulesForReportType = (reportType: GenerationReportType) => {
  const definition = getGenerationReportTypeDefinition(reportType);
  const modules = definition.dataSources
    .map(mapDataSourceToModuleKey)
    .filter((key): key is NonNullable<typeof key> => key !== null);
  return modules;
};

/**
 * Collects institutional data via the Report Data Aggregation Engine.
 */
export class DataCollectionService {
  async collect(
    reportType: GenerationReportType,
    filters: ReportGenerationFilters,
  ): Promise<CollectedReportData> {
    const modules = resolveModulesForReportType(reportType);
    const aggregationFilters: AggregationFilters = {
      ...mapToAggregationFilters(filters),
      modules,
    };

    logger.info('Collecting report data via aggregation engine', {
      reportType,
      modules,
      filters,
    });

    const result = await aggregationService.aggregate(aggregationFilters);

    const sections: ReportDataSection[] = modules.map((moduleKey) => {
      const stats = result.statistics.byModule[moduleKey];
      return {
        key: moduleKey,
        label: stats?.label ?? moduleKey,
        collection: moduleKey,
        recordCount: stats?.totalCount ?? 0,
        records: result.records.byModule[moduleKey] ?? [],
      };
    });

    return {
      reportType,
      filters,
      collectedAt: new Date(result.metadata.generatedAt),
      sections,
      totals: {
        placements: result.statistics.byModule.placements?.totalCount,
        internships: result.statistics.byModule.internships?.totalCount,
        studentAchievements: result.statistics.byModule.studentAchievements?.totalCount,
        facultyAchievements: result.statistics.byModule.facultyAchievements?.totalCount,
        publications: result.statistics.byModule.publications?.totalCount,
        patents: result.statistics.byModule.patents?.totalCount,
        completedEvents: result.statistics.byModule.completedEventReports?.totalCount,
        pendingReviews: result.statistics.byModule.pendingReviews?.totalCount,
      },
      aggregation: result,
    };
  }

  async collectForContext(context: ReportPipelineContext): Promise<ReportPipelineContext> {
    const collectedData = await this.collect(context.reportType, context.filters);
    return { ...context, collectedData };
  }
}

export const dataCollectionService = new DataCollectionService();
