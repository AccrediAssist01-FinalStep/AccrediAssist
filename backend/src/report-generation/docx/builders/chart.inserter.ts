import { Paragraph, Table } from 'docx';
import type { PreparedChart } from '../../interfaces/report-data.interface';
import { toDocxExport } from '../../charts/utils/chart-export.util';
import type { StandardChart } from '../../charts/interfaces/chart.interface';
import {
  buildBodyParagraph,
  buildSectionHeading,
} from '../utils/header-footer.util';
import { tableBuilder } from './table.builder';

export class ChartInserter {
  insertChart(chart: PreparedChart): Array<Paragraph | Table> {
    const standardChart: StandardChart = {
      chartType: chart.chartType === 'table' ? 'bar' : chart.chartType,
      labels: chart.labels,
      datasets: chart.datasets,
      metadata: {
        id: chart.id,
        title: chart.title,
        source: 'aggregation',
        exportFormats: ['docx'],
        generatedAt: chart.metadata?.generatedAt ?? new Date().toISOString(),
        module: chart.metadata?.module as StandardChart['metadata']['module'],
        period: chart.metadata?.period,
        totalRecords: chart.metadata?.totalRecords,
      },
    };

    const docxExport = toDocxExport(standardChart);
    const datasetLabels = chart.datasets.map((dataset) => dataset.label);

    const headers = ['Label', ...datasetLabels];
    const rows = docxExport.tableRows.map((row) => [
      row.label,
      ...datasetLabels.map((label) => String(row.values[label] ?? 0)),
    ]);

    return [
      buildSectionHeading(chart.title, 2),
      buildBodyParagraph(`Chart type: ${chart.chartType.toUpperCase()} — data sourced from aggregated institutional records.`),
      tableBuilder.build({ headers, rows }),
      buildBodyParagraph(''),
    ];
  }

  insertCharts(charts: PreparedChart[] = []): Array<Paragraph | Table> {
    if (charts.length === 0) {
      return [buildBodyParagraph('No chart data was available for this report scope.')];
    }

    return charts.flatMap((chart) => this.insertChart(chart));
  }
}

export const chartInserter = new ChartInserter();
