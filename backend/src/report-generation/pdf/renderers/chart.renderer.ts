import PDFDocument from 'pdfkit';
import type { PreparedChart } from '../../interfaces/report-data.interface';
import type { PdfLayoutState } from '../interfaces/pdf-report.interface';
import { PDF_COLORS, PDF_LAYOUT, getContentWidth } from '../config/pdf.config';
import { headerFooterService } from '../utils/header-footer.util';

type PdfDoc = InstanceType<typeof PDFDocument>;

const CHART_HEIGHT = 180;
const CHART_PADDING = 20;

export class ChartRenderer {
  render(
    doc: PdfDoc,
    state: PdfLayoutState,
    chart: PreparedChart,
  ): void {
    headerFooterService.ensureSpace(doc, state, CHART_HEIGHT + 60);

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(PDF_COLORS.primary)
      .text(chart.title, PDF_LAYOUT.margin, state.y, { width: getContentWidth() });

    state.y += 22;

    const dataset = chart.datasets[0];
    if (!dataset || chart.labels.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor(PDF_COLORS.secondary)
        .text('No chart data available.', PDF_LAYOUT.margin, state.y);
      state.y += 24;
      return;
    }

    const chartTop = state.y + CHART_PADDING;
    const chartLeft = PDF_LAYOUT.margin + CHART_PADDING;
    const chartWidth = getContentWidth() - CHART_PADDING * 2;
    const chartInnerHeight = CHART_HEIGHT - CHART_PADDING * 2;

    const maxValue = Math.max(...dataset.data, 1);

    if (chart.chartType === 'pie' || chart.chartType === 'doughnut') {
      this.renderPieChart(doc, chart, chartLeft, chartTop, chartWidth, chartInnerHeight);
    } else if (chart.chartType === 'line' || chart.chartType === 'area') {
      this.renderLineChart(
        doc,
        chart.labels,
        dataset.data,
        chartLeft,
        chartTop,
        chartWidth,
        chartInnerHeight,
        chart.chartType === 'area',
      );
    } else {
      this.renderBarChart(
        doc,
        chart.labels,
        dataset.data,
        chartLeft,
        chartTop,
        chartWidth,
        chartInnerHeight,
        maxValue,
      );
    }

    state.y += CHART_HEIGHT + 16;

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(PDF_COLORS.secondary)
      .text(`Chart type: ${chart.chartType.toUpperCase()} | Source: aggregated institutional data`, PDF_LAYOUT.margin, state.y);
    state.y += 20;
  }

  private renderBarChart(
    doc: PdfDoc,
    labels: string[],
    data: number[],
    left: number,
    top: number,
    width: number,
    height: number,
    maxValue: number,
  ): void {
    this.drawGrid(doc, left, top, width, height);

    const barCount = labels.length;
    const barGap = 6;
    const barWidth = (width - barGap * (barCount + 1)) / Math.max(barCount, 1);

    labels.forEach((label, index) => {
      const value = data[index] ?? 0;
      const barHeight = (value / maxValue) * (height - 20);
      const x = left + barGap + index * (barWidth + barGap);
      const y = top + height - barHeight - 10;

      doc.rect(x, y, barWidth, barHeight).fill(PDF_COLORS.chartBar);

      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(PDF_COLORS.secondary)
        .text(label.slice(0, 12), x - 4, top + height - 4, {
          width: barWidth + 8,
          align: 'center',
          lineBreak: false,
        });
    });
  }

  private renderLineChart(
    doc: PdfDoc,
    labels: string[],
    data: number[],
    left: number,
    top: number,
    width: number,
    height: number,
    fillArea: boolean,
  ): void {
    this.drawGrid(doc, left, top, width, height);

    const maxValue = Math.max(...data, 1);
    const points = data.map((value, index) => {
      const x = left + (index / Math.max(data.length - 1, 1)) * width;
      const y = top + height - 10 - (value / maxValue) * (height - 20);
      return { x, y };
    });

    if (fillArea && points.length > 1) {
      doc.moveTo(points[0].x, top + height - 10);
      points.forEach((point) => doc.lineTo(point.x, point.y));
      doc.lineTo(points[points.length - 1].x, top + height - 10).closePath()
        .fillOpacity(0.15)
        .fill(PDF_COLORS.chartLine)
        .fillOpacity(1);
    }

    if (points.length > 0) {
      doc.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((point) => doc.lineTo(point.x, point.y));
      doc.lineWidth(2).strokeColor(PDF_COLORS.chartLine).stroke();
    }

    labels.forEach((label, index) => {
      if (index % Math.ceil(labels.length / 6) !== 0 && index !== labels.length - 1) return;
      const x = left + (index / Math.max(labels.length - 1, 1)) * width;
      doc.font('Helvetica').fontSize(7).fillColor(PDF_COLORS.secondary)
        .text(label.slice(0, 10), x - 15, top + height - 2, { width: 30, align: 'center', lineBreak: false });
    });
  }

  private renderPieChart(
    doc: PdfDoc,
    chart: PreparedChart,
    left: number,
    top: number,
    width: number,
    _height: number,
  ): void {
    const data = chart.datasets[0]?.data ?? [];
    const total = data.reduce((sum, value) => sum + value, 0) || 1;
    const colors = ['#2E75B6', '#70AD47', '#FFC000', '#ED7D31', '#5B9BD5', '#A5A5A5'];
    const barHeight = 14;
    let y = top + 10;

    chart.labels.slice(0, 8).forEach((label, index) => {
      const value = data[index] ?? 0;
      const barWidth = (value / total) * (width - 140);

      doc.rect(left, y, 12, 12).fill(colors[index % colors.length]);
      doc.font('Helvetica').fontSize(8).fillColor(PDF_COLORS.secondary)
        .text(`${label}: ${value}`, left + 18, y + 1, { width: 120, lineBreak: false });

      doc.rect(left + 140, y + 2, barWidth, 8).fill(colors[index % colors.length]);
      y += barHeight + 4;
    });
  }

  private drawGrid(
    doc: PdfDoc,
    left: number,
    top: number,
    width: number,
    height: number,
  ): void {
    doc.rect(left, top, width, height).strokeColor(PDF_COLORS.chartGrid).lineWidth(0.5).stroke();

    for (let i = 1; i <= 4; i += 1) {
      const y = top + (height / 4) * i;
      doc.moveTo(left, y).lineTo(left + width, y).strokeColor(PDF_COLORS.chartGrid).lineWidth(0.3).stroke();
    }
  }
}

export const chartRenderer = new ChartRenderer();
