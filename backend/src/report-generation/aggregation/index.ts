export { aggregationService, AggregationService } from './services/aggregation.service';
export { aggregationRepository, AggregationRepository } from './repositories/aggregation.repository';
export {
  AGGREGATION_MODULE_KEYS,
  type AggregationModuleKey,
  type AggregationFilters,
  type ReportAggregationResult,
  type ModuleStatistics,
  type ModuleChartData,
} from './interfaces/aggregation.interface';
export {
  MODULE_AGGREGATION_CONFIGS,
  mapDataSourceToModuleKey,
  getModuleConfig,
  listModuleConfigs,
} from './config/module-aggregation.config';
export { normalizeFilters } from './utils/aggregation-filter.util';
export { resolveDateRange, resolveAcademicYearRange } from './utils/aggregation-date.util';
