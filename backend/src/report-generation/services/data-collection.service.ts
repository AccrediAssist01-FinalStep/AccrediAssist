import { GenerationReportType } from '../config/report-types.config';
import { aggregationService } from '../aggregation/services/aggregation.service';
import { mapDataSourceToModuleKey } from '../aggregation/config/module-aggregation.config';
import type { AggregationFilters } from '../aggregation/interfaces/aggregation.interface';
import { getGenerationReportTypeDefinition } from '../config/report-types.config';
import {
  CollectedReportData,
  ReportPipelineContext,
} from '../interfaces/report-data.interface';
import { ReportGenerationFilters } from '../interfaces/report-generation.interface';
import { mapToAggregationFilters } from '../utils/filter-mapper.util';
import { buildDateWiseStudentActivityRegister } from '../utils/date-wise-register.util';
import {
  buildReportSummaryStats,
  buildSectionedReportData,
} from '../utils/sectioned-report.util';
import { logger } from '../../utils/logger';

const resolveModulesForReportType = (reportType: GenerationReportType) => {
  const definition = getGenerationReportTypeDefinition(reportType);
  return definition.dataSources
    .map(mapDataSourceToModuleKey)
    .filter((key): key is NonNullable<typeof key> => key !== null);
};

const resolveEventTypeForReport = (reportType: GenerationReportType): string | undefined => {
  if (reportType === 'AI Generated Workshop') return 'Workshop';
  if (reportType === 'AI Generated Industrial Visit') return 'Industrial Visit';
  return undefined;
};

export class DataCollectionService {
  async collect(
    reportType: GenerationReportType,
    filters: ReportGenerationFilters,
  ): Promise<CollectedReportData> {
    const modules = resolveModulesForReportType(reportType);
    const aggregationFilters: AggregationFilters = {
      ...mapToAggregationFilters(filters),
      modules,
      eventType: resolveEventTypeForReport(reportType),
    };

    logger.info('Collecting report data via aggregation engine', {
      reportType,
      modules,
      filters,
    });

    const result = await aggregationService.aggregate(aggregationFilters);
    const sections = buildSectionedReportData(reportType, result, filters.keyword);
    const summaryStats = buildReportSummaryStats(reportType, sections, result);
    const dateWiseRegister =
      reportType === 'Student Activities'
        ? buildDateWiseStudentActivityRegister(result, filters.keyword)
        : undefined;

    return {
      reportType,
      filters,
      collectedAt: new Date(result.metadata.generatedAt),
      sections,
      dateWiseRegister,
      totals: {
        placements: result.statistics.byModule.placements?.totalCount,
        internships: result.statistics.byModule.internships?.totalCount,
        studentAchievements: result.statistics.byModule.studentAchievements?.totalCount,
        facultyAchievements: result.statistics.byModule.facultyAchievements?.totalCount,
        publications: result.statistics.byModule.publications?.totalCount,
        patents: result.statistics.byModule.patents?.totalCount,
        completedEvents: result.statistics.byModule.completedEventReports?.totalCount,
      },
      aggregation: result,
      summaryStats,
    };
  }

  async collectForContext(context: ReportPipelineContext): Promise<ReportPipelineContext> {
    const collectedData = await this.collect(context.reportType, context.filters);
    return { ...context, collectedData };
  }
}

export const dataCollectionService = new DataCollectionService();
