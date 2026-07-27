import { logger } from '../../../utils/logger';
import type { GenerationReportType } from '../../config/report-types.config';
import type { ReportAggregationResult } from '../../aggregation/interfaces/aggregation.interface';
import { getChartDefinitionsForReportType, getAllChartDefinitions } from '../config/report-chart.config';
import { chartFactory, ChartFactory } from '../factory/chart.factory';
import type { ChartDefinitionId } from '../interfaces/chart-definition.interface';
import type { ChartExportFormat, ChartGenerationResult, StandardChart } from '../interfaces/chart.interface';
import {
  buildChartCacheKey,
  getCachedChartResult,
  setCachedChartResult,
} from '../utils/chart-cache.util';
import { toExportPayload, toPreparedCharts } from '../utils/chart-export.util';
import type { PreparedChart } from '../../interfaces/report-data.interface';

export class ChartService {
  constructor(private readonly factory: ChartFactory = chartFactory) {}

  generateAll(aggregation: ReportAggregationResult, useCache = true): ChartGenerationResult {
    const cacheKey = buildChartCacheKey(
      'all',
      'all',
      aggregation.metadata.filters,
      aggregation.metadata.modules,
    );

    if (useCache) {
      const cached = getCachedChartResult(cacheKey);
      if (cached) {
        logger.debug('Chart cache hit', { scope: 'all', chartCount: cached.charts.length });
        return cached;
      }
    }

    const charts = this.factory.createAll(aggregation);
    const result: ChartGenerationResult = { charts, generatedAt: new Date(), fromCache: false };

    if (useCache) {
      setCachedChartResult(cacheKey, result);
    }

    logger.info('Charts generated from aggregation', {
      scope: 'all',
      chartCount: charts.length,
      modules: aggregation.metadata.modules,
    });

    return result;
  }

  generateForReportType(
    reportType: GenerationReportType,
    aggregation: ReportAggregationResult,
    useCache = true,
  ): ChartGenerationResult {
    const cacheKey = buildChartCacheKey(
      'report',
      reportType,
      aggregation.metadata.filters,
      aggregation.metadata.modules,
    );

    if (useCache) {
      const cached = getCachedChartResult(cacheKey);
      if (cached) {
        logger.debug('Chart cache hit', { scope: 'report', reportType, chartCount: cached.charts.length });
        return cached;
      }
    }

    const definitions = getChartDefinitionsForReportType(reportType);
    const charts = definitions
      .map((definition) => this.factory.createFromDefinition(definition, aggregation))
      .filter((chart): chart is StandardChart => chart !== null);

    const result: ChartGenerationResult = { charts, generatedAt: new Date(), fromCache: false };

    if (useCache) {
      setCachedChartResult(cacheKey, result);
    }

    logger.info('Report charts generated from aggregation', {
      reportType,
      chartCount: charts.length,
    });

    return result;
  }

  generateByIds(
    chartIds: ChartDefinitionId[],
    aggregation: ReportAggregationResult,
  ): StandardChart[] {
    return this.factory.createMany(chartIds, aggregation);
  }

  toPreparedCharts(charts: StandardChart[]): PreparedChart[] {
    return toPreparedCharts(charts);
  }

  toExportFormat(charts: StandardChart[], format: ChartExportFormat) {
    return charts.map((chart) => toExportPayload(chart, format));
  }

  listSupportedChartIds(): ChartDefinitionId[] {
    return getAllChartDefinitions().map((definition) => definition.id);
  }
}

export const chartService = new ChartService();
