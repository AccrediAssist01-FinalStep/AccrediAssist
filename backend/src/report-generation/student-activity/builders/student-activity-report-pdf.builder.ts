import PDFDocument from 'pdfkit';
import {
  STUDENT_ACTIVITY_REPORT_HEADINGS,
  STUDENT_ACTIVITY_REPORT_TITLE,
} from '../student-activity-report-template.config';
import type {
  StudentActivityModuleTable,
  StudentActivityReportGeneratorInput,
} from '../student-activity-report.types';
import {
  getStudentActivityColumnWidths,
  getStudentActivityTableHeaders,
  toStudentActivityRowValues,
} from '../utils/student-activity-table.util';

type PdfDoc = InstanceType<typeof PDFDocument>;

const MARGIN = 72;
const CONTENT_WIDTH = 612 - MARGIN * 2;

const writeCentered = (doc: PdfDoc, text: string, size: number, bold = false): void => {
  doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(size).text(text, MARGIN, doc.y, {
    width: CONTENT_WIDTH,
    align: 'center',
  });
  doc.moveDown(0.5);
};

const writeHeading = (doc: PdfDoc, text: string): void => {
  doc.moveDown(0.5);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#000000').text(text, MARGIN, doc.y, {
    width: CONTENT_WIDTH,
    align: 'left',
  });
  doc.moveDown(0.3);
};

const writeBody = (doc: PdfDoc, text: string): void => {
  doc.font('Helvetica').fontSize(12).fillColor('#000000').text(text, MARGIN, doc.y, {
    width: CONTENT_WIDTH,
    align: 'justify',
    lineGap: 3,
  });
  doc.moveDown(0.4);
};

const drawTableRow = (
  doc: PdfDoc,
  startY: number,
  columnWidths: number[],
  cells: string[],
  options: { header?: boolean; minRowHeight?: number },
): number => {
  const fontSize = options.header ? 9 : 9;
  const font = options.header ? 'Helvetica-Bold' : 'Helvetica';
  const paddingX = 4;
  const paddingY = 5;

  doc.font(font).fontSize(fontSize);

  const measuredHeights = cells.map((cell, index) =>
    doc.heightOfString(cell, { width: columnWidths[index] - paddingX * 2 }),
  );
  const rowHeight = Math.max(options.minRowHeight ?? 22, ...measuredHeights.map((h) => h + paddingY * 2));

  let x = MARGIN;
  cells.forEach((cell, index) => {
    const width = columnWidths[index];
    doc.rect(x, startY, width, rowHeight).stroke('#000000');
    doc
      .fillColor('#000000')
      .text(cell, x + paddingX, startY + paddingY, {
        width: width - paddingX * 2,
        lineBreak: true,
      });
    x += width;
  });

  return startY + rowHeight;
};

const writeModuleTable = (doc: PdfDoc, module: StudentActivityModuleTable): void => {
  writeHeading(doc, module.heading);

  const columnWidths = getStudentActivityColumnWidths(CONTENT_WIDTH);
  const headers = getStudentActivityTableHeaders();
  let tableY = doc.y;

  if (tableY > 680) {
    doc.addPage();
    tableY = MARGIN;
  }

  tableY = drawTableRow(doc, tableY, columnWidths, headers, { header: true, minRowHeight: 24 });

  if (module.rows.length === 0) {
    tableY = drawTableRow(
      doc,
      tableY,
      columnWidths,
      ['No records available for this module.', '', '', '', ''],
      { minRowHeight: 22 },
    );
    doc.y = tableY + 10;
    return;
  }

  module.rows.forEach((row) => {
    if (tableY > 700) {
      doc.addPage();
      tableY = MARGIN;
      tableY = drawTableRow(doc, tableY, columnWidths, headers, { header: true, minRowHeight: 24 });
    }

    tableY = drawTableRow(doc, tableY, columnWidths, toStudentActivityRowValues(row), {
      minRowHeight: 22,
    });
  });

  doc.y = tableY + 10;
};

export const buildStudentActivityReportPdf = async (
  input: StudentActivityReportGeneratorInput,
): Promise<Buffer> => {
  const { content } = input;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk as Buffer));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    writeCentered(doc, content.department, 12);
    writeCentered(doc, STUDENT_ACTIVITY_REPORT_TITLE, 16, true);
    writeCentered(doc, `Academic Year: ${content.academicYear}`, 11);
    doc.moveDown(0.5);

    writeHeading(doc, STUDENT_ACTIVITY_REPORT_HEADINGS.introduction);
    content.introduction.forEach((paragraph) => writeBody(doc, paragraph));

    content.modules.forEach((module) => writeModuleTable(doc, module));

    writeHeading(doc, STUDENT_ACTIVITY_REPORT_HEADINGS.conclusion);
    content.conclusion.forEach((paragraph) => writeBody(doc, paragraph));

    doc.end();
  });
};
