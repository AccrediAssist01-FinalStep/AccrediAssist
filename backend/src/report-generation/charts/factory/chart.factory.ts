import type { ReportAggregationResult } from '../../aggregation/interfaces/aggregation.interface';
import { CHART_DEFINITIONS } from '../config/chart-definitions.config';
import type { ChartDefinition, ChartDefinitionId } from '../interfaces/chart-definition.interface';
import type { StandardChart } from '../interfaces/chart.interface';

export class ChartFactory {
  create(definitionId: ChartDefinitionId, aggregation: ReportAggregationResult): StandardChart | null {
    const definition = CHART_DEFINITIONS[definitionId];
    return definition.build(aggregation);
  }

  createFromDefinition(
    definition: ChartDefinition,
    aggregation: ReportAggregationResult,
  ): StandardChart | null {
    return definition.build(aggregation);
  }

  createMany(
    definitionIds: ChartDefinitionId[],
    aggregation: ReportAggregationResult,
  ): StandardChart[] {
    return definitionIds
      .map((id) => this.create(id, aggregation))
      .filter((chart): chart is StandardChart => chart !== null);
  }

  createAll(aggregation: ReportAggregationResult): StandardChart[] {
    return (Object.keys(CHART_DEFINITIONS) as ChartDefinitionId[])
      .map((id) => this.create(id, aggregation))
      .filter((chart): chart is StandardChart => chart !== null);
  }
}

export const chartFactory = new ChartFactory();
