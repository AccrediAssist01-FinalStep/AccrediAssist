import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import type {
  TemplateActivityReportInput,
  TemplateModuleTable,
} from '../template-activity-report.types';
import { STANDARD_TEMPLATE_COLUMN_WIDTHS_DXA, getTemplateColumnWidths, resolveModuleColumnWeights } from '../utils/template-table.util';

const FONT = 'Times New Roman';
const BODY_SIZE = 22;
const TITLE_SIZE = 28;
const SECTION_SIZE = 24;
const MODULE_SIZE = 22;
const TABLE_HEADER_SIZE = 20;
const TABLE_BODY_SIZE = 20;
const LINE_SPACING = 276;

const TABLE_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
};

const cellMargins = { top: 80, bottom: 80, left: 100, right: 100 };

const centeredHeading = (text: string, size: number): Paragraph =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200, line: LINE_SPACING },
    children: [new TextRun({ text, font: FONT, size, bold: true })],
  });

const sectionHeading = (text: string): Paragraph =>
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 120, line: LINE_SPACING },
    children: [new TextRun({ text, font: FONT, size: SECTION_SIZE, bold: true })],
  });

const moduleHeading = (text: string): Paragraph =>
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 80, line: LINE_SPACING },
    children: [new TextRun({ text, font: FONT, size: MODULE_SIZE, bold: true })],
  });

const bodyParagraph = (text: string): Paragraph =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: LINE_SPACING },
    children: [new TextRun({ text, font: FONT, size: BODY_SIZE })],
  });

const buildModuleTable = (
  module: TemplateModuleTable,
  fallbackHeaders: readonly string[],
  fallbackWeights: readonly number[],
): Table => {
  const headers = module.headers && module.headers.length > 0 ? module.headers : [...fallbackHeaders];
  const columnWeights = resolveModuleColumnWeights(headers, fallbackWeights);
  const columnWidths = getTemplateColumnWidths(columnWeights, STANDARD_TEMPLATE_COLUMN_WIDTHS_DXA.reduce((sum, width) => sum + width, 0));

  const buildCell = (value: string, columnIndex: number, bold = false): TableCell =>
    new TableCell({
      borders: TABLE_BORDERS,
      margins: cellMargins,
      verticalAlign: VerticalAlign.CENTER,
      width: {
        size: columnWidths[columnIndex] ?? 1800,
        type: WidthType.DXA,
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: value,
              font: FONT,
              size: bold ? TABLE_HEADER_SIZE : TABLE_BODY_SIZE,
              bold,
            }),
          ],
        }),
      ],
    });

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((header, index) => buildCell(header, index, true)),
  });

  const dataRows =
    module.rows.length === 0
      ? [
          new TableRow({
            children: [
              new TableCell({
                borders: TABLE_BORDERS,
                margins: cellMargins,
                columnSpan: headers.length,
                verticalAlign: VerticalAlign.CENTER,
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: 'No records available for this module.',
                        font: FONT,
                        size: TABLE_BODY_SIZE,
                        italics: true,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ]
      : module.rows.map(
          (row) =>
            new TableRow({
              children: row.map((value, index) => buildCell(value, index)),
            }),
        );

  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths,
    borders: TABLE_BORDERS,
    rows: [headerRow, ...dataRows],
  });
};

export const buildTemplateActivityReportDocx = async (
  input: TemplateActivityReportInput,
): Promise<Buffer> => {
  const { content } = input;
  const children: (Paragraph | Table)[] = [];

  children.push(
    centeredHeading(content.department, 24),
    centeredHeading(content.reportTitle, TITLE_SIZE),
    centeredHeading(`Academic Year: ${content.academicYear}`, 22),
  );

  children.push(sectionHeading('Introduction'));
  content.introduction.forEach((paragraph) => children.push(bodyParagraph(paragraph)));

  content.modules.forEach((module) => {
    children.push(moduleHeading(module.heading));
    children.push(buildModuleTable(module, content.tableHeaders, content.columnWeights));
  });

  children.push(sectionHeading('Conclusion'));
  content.conclusion.forEach((paragraph) => children.push(bodyParagraph(paragraph)));

  return Packer.toBuffer(new Document({ sections: [{ children }] }));
};
