import { getGenerationReportTypeDefinition } from '../../config/report-types.config';
import type { GenerationReportType } from '../../config/report-types.config';
import { mapDataSourceToModuleKey } from '../../aggregation/config/module-aggregation.config';
import type { AggregationModuleKey } from '../../aggregation/interfaces/aggregation.interface';
import {
  CHART_DEFINITIONS,
  listChartDefinitions,
} from './chart-definitions.config';
import type { ChartDefinitionId } from '../interfaces/chart-definition.interface';

const INSTITUTIONAL_CHARTS: ChartDefinitionId[] = [
  'department-wise-distribution',
  'category-wise-distribution',
  'pending-vs-approved-records',
  'yearly-growth-analysis',
];

const MODULE_CHART_MAP: Partial<Record<AggregationModuleKey, ChartDefinitionId>> = {
  placements: 'monthly-placements',
  internships: 'monthly-internships',
  studentAchievements: 'student-achievement-trends',
  facultyAchievements: 'faculty-achievement-trends',
  publications: 'publication-trends',
  patents: 'patent-trends',
  completedEventReports: 'completed-event-statistics',
};

export const resolveReportModules = (reportType: GenerationReportType): AggregationModuleKey[] => {
  const definition = getGenerationReportTypeDefinition(reportType);
  return definition.dataSources
    .map(mapDataSourceToModuleKey)
    .filter((key): key is AggregationModuleKey => key !== null);
};

/** Chart IDs applicable to a specific report type based on its data sources */
export const getChartIdsForReportType = (reportType: GenerationReportType): ChartDefinitionId[] => {
  const modules = resolveReportModules(reportType);
  const moduleCharts = modules
    .map((module) => MODULE_CHART_MAP[module])
    .filter((chartId): chartId is ChartDefinitionId => !!chartId);

  return [...new Set([...moduleCharts, ...INSTITUTIONAL_CHARTS])];
};

export const getChartDefinitionsForReportType = (reportType: GenerationReportType) => {
  const chartIds = getChartIdsForReportType(reportType);
  return chartIds.map((id) => CHART_DEFINITIONS[id]);
};

/** All supported chart definitions for dashboard-wide analytics */
export const getAllChartDefinitions = () => listChartDefinitions();
