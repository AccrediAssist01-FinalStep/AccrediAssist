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
import {
  STUDENT_ACTIVITY_REPORT_HEADINGS,
  STUDENT_ACTIVITY_REPORT_TITLE,
  STUDENT_ACTIVITY_REPORT_TYPOGRAPHY,
} from '../student-activity-report-template.config';
import type {
  StudentActivityModuleTable,
  StudentActivityReportGeneratorInput,
} from '../student-activity-report.types';
import {
  getStudentActivityTableHeaders,
  STUDENT_ACTIVITY_TABLE_COLUMN_WIDTHS_DXA,
  toStudentActivityRowValues,
} from '../utils/student-activity-table.util';

const FONT = STUDENT_ACTIVITY_REPORT_TYPOGRAPHY.fontFamily;

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
    spacing: { before: 200, after: 200, line: STUDENT_ACTIVITY_REPORT_TYPOGRAPHY.lineSpacing },
    children: [new TextRun({ text, font: FONT, size, bold: true })],
  });

const sectionHeading = (text: string): Paragraph =>
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 240, after: 120, line: STUDENT_ACTIVITY_REPORT_TYPOGRAPHY.lineSpacing },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: STUDENT_ACTIVITY_REPORT_TYPOGRAPHY.sectionHeadingSize,
        bold: true,
      }),
    ],
  });

const moduleHeading = (text: string): Paragraph =>
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 80, line: STUDENT_ACTIVITY_REPORT_TYPOGRAPHY.lineSpacing },
    children: [
      new TextRun({
        text,
        font: FONT,
        size: STUDENT_ACTIVITY_REPORT_TYPOGRAPHY.moduleHeadingSize,
        bold: true,
      }),
    ],
  });

const bodyParagraph = (text: string): Paragraph =>
  new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: STUDENT_ACTIVITY_REPORT_TYPOGRAPHY.lineSpacing },
    children: [new TextRun({ text, font: FONT, size: STUDENT_ACTIVITY_REPORT_TYPOGRAPHY.bodySize })],
  });

const buildTableCell = (value: string, columnIndex: number, bold = false): TableCell =>
  new TableCell({
    borders: TABLE_BORDERS,
    margins: cellMargins,
    verticalAlign: VerticalAlign.CENTER,
    width: {
      size: STUDENT_ACTIVITY_TABLE_COLUMN_WIDTHS_DXA[columnIndex],
      type: WidthType.DXA,
    },
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [
          new TextRun({
            text: value,
            font: FONT,
            size: bold
              ? STUDENT_ACTIVITY_REPORT_TYPOGRAPHY.tableHeaderSize
              : STUDENT_ACTIVITY_REPORT_TYPOGRAPHY.tableBodySize,
            bold,
          }),
        ],
      }),
    ],
  });

const buildModuleTable = (module: StudentActivityModuleTable): Table => {
  const headers = getStudentActivityTableHeaders();

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((header, index) => buildTableCell(header, index, true)),
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
                        size: STUDENT_ACTIVITY_REPORT_TYPOGRAPHY.tableBodySize,
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
              children: toStudentActivityRowValues(row).map((value, index) =>
                buildTableCell(value, index),
              ),
            }),
        );

  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: STUDENT_ACTIVITY_TABLE_COLUMN_WIDTHS_DXA,
    borders: TABLE_BORDERS,
    rows: [headerRow, ...dataRows],
  });
};

export const buildStudentActivityReportDocx = async (
  input: StudentActivityReportGeneratorInput,
): Promise<Buffer> => {
  const { content } = input;
  const children: (Paragraph | Table)[] = [];

  children.push(
    centeredHeading(content.department, 24),
    centeredHeading(STUDENT_ACTIVITY_REPORT_TITLE, STUDENT_ACTIVITY_REPORT_TYPOGRAPHY.titleSize),
    centeredHeading(`Academic Year: ${content.academicYear}`, 22),
  );

  children.push(sectionHeading(STUDENT_ACTIVITY_REPORT_HEADINGS.introduction));
  content.introduction.forEach((paragraph) => children.push(bodyParagraph(paragraph)));

  content.modules.forEach((module) => {
    children.push(moduleHeading(module.heading));
    children.push(buildModuleTable(module));
  });

  children.push(sectionHeading(STUDENT_ACTIVITY_REPORT_HEADINGS.conclusion));
  content.conclusion.forEach((paragraph) => children.push(bodyParagraph(paragraph)));

  const document = new Document({
    sections: [{ children }],
  });

  return Packer.toBuffer(document);
};
