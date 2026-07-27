import { Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import { DOCX_TYPOGRAPHY } from '../config/docx.config';
import type { DocxTableSpec } from '../interfaces/docx-report.interface';

const cellMargins = {
  top: 80,
  bottom: 80,
  left: 120,
  right: 120,
};

export class TableBuilder {
  build(spec: DocxTableSpec): Table {
    const columnCount = spec.headers.length;

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: spec.headers.map(
            (header) =>
              new TableCell({
                margins: cellMargins,
                shading: { fill: '1F3864' },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: header,
                        bold: true,
                        color: 'FFFFFF',
                        font: DOCX_TYPOGRAPHY.fontFamily,
                        size: 20,
                      }),
                    ],
                  }),
                ],
              }),
          ),
        }),
        ...spec.rows.map(
          (row) =>
            new TableRow({
              children: Array.from({ length: columnCount }).map((_, index) => {
                const value = row[index] ?? '';
                return new TableCell({
                  margins: cellMargins,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: value,
                          font: DOCX_TYPOGRAPHY.fontFamily,
                          size: 20,
                        }),
                      ],
                    }),
                  ],
                });
              }),
            }),
        ),
      ],
    });
  }

  buildStatisticsTable(
    rows: Array<{ module: string; total: number; growth: string }>,
  ): Table {
    return this.build({
      headers: ['Module', 'Total Records', 'Growth (%)'],
      rows: rows.map((row) => [row.module, String(row.total), row.growth]),
    });
  }

  buildRecordsTable(headers: string[], records: Record<string, unknown>[]): Table {
    const rows = records.map((record) =>
      headers.map((header) => {
        const value = record[header];
        if (value === null || value === undefined) return '';
        if (value instanceof Date) return value.toISOString().slice(0, 10);
        return String(value);
      }),
    );

    return this.build({ headers, rows });
  }
}

export const tableBuilder = new TableBuilder();
