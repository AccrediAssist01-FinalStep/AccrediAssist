import PDFDocument from 'pdfkit';
import type { PdfLayoutState } from '../interfaces/pdf-report.interface';
import { PDF_COLORS, PDF_LAYOUT, getContentWidth } from '../config/pdf.config';
import { headerFooterService } from '../utils/header-footer.util';

type PdfDoc = InstanceType<typeof PDFDocument>;

const ROW_HEIGHT = 22;
const HEADER_HEIGHT = 26;

export class TableRenderer {
  render(
    doc: PdfDoc,
    state: PdfLayoutState,
    headers: string[],
    rows: string[][],
  ): void {
    if (headers.length === 0) return;

    const columnWidth = getContentWidth() / headers.length;

    const drawHeader = (): void => {
      headerFooterService.ensureSpace(doc, state, HEADER_HEIGHT + ROW_HEIGHT);

      headers.forEach((header, index) => {
        const x = PDF_LAYOUT.margin + index * columnWidth;
        doc.rect(x, state.y, columnWidth, HEADER_HEIGHT).fill(PDF_COLORS.headerBg);
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(PDF_COLORS.headerText)
          .text(header, x + 4, state.y + 7, {
            width: columnWidth - 8,
            lineBreak: false,
            ellipsis: true,
          });
      });

      state.y += HEADER_HEIGHT;
    };

    drawHeader();

    rows.forEach((row, rowIndex) => {
      headerFooterService.ensureSpace(doc, state, ROW_HEIGHT);

      if (rowIndex > 0 && state.y === PDF_LAYOUT.margin + PDF_LAYOUT.headerHeight) {
        drawHeader();
      }

      row.forEach((cell, index) => {
        const x = PDF_LAYOUT.margin + index * columnWidth;
        const fill = rowIndex % 2 === 0 ? '#F7F9FC' : '#FFFFFF';

        doc.rect(x, state.y, columnWidth, ROW_HEIGHT).fill(fill);
        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor('#333333')
          .text(cell, x + 4, state.y + 6, {
            width: columnWidth - 8,
            lineBreak: false,
            ellipsis: true,
          });
      });

      state.y += ROW_HEIGHT;
    });

    state.y += 12;
  }

  renderStatisticsTable(
    doc: PdfDoc,
    state: PdfLayoutState,
    rows: Array<{ module: string; total: number; growth: string }>,
  ): void {
    this.render(
      doc,
      state,
      ['Module', 'Total Records', 'Growth (%)'],
      rows.map((row) => [row.module, String(row.total), row.growth]),
    );
  }

  renderRecordsTable(
    doc: PdfDoc,
    state: PdfLayoutState,
    headers: string[],
    records: Record<string, unknown>[],
  ): void {
    const rows = records.map((record) =>
      headers.map((header) => {
        const value = record[header];
        if (value === null || value === undefined) return '';
        if (value instanceof Date) return value.toISOString().slice(0, 10);
        return String(value);
      }),
    );

    this.render(doc, state, headers, rows);
  }
}

export const tableRenderer = new TableRenderer();
