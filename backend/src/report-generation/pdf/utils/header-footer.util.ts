import PDFDocument from 'pdfkit';
import type { PdfLayoutState } from '../interfaces/pdf-report.interface';
import { PDF_LAYOUT } from '../config/pdf.config';

type PdfDoc = InstanceType<typeof PDFDocument>;

export class HeaderFooterService {
  applyPageDecorations(doc: PdfDoc, reportTitle: string): void {
    const range = doc.bufferedPageRange();

    for (let i = range.start; i < range.start + range.count; i += 1) {
      doc.switchToPage(i);

      if (i === 0) continue;

      const pageNum = i + 1;
      const contentTop = PDF_LAYOUT.margin / 2;

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#666666')
        .text(reportTitle, PDF_LAYOUT.margin, contentTop, {
          width: PDF_LAYOUT.pageWidth - PDF_LAYOUT.margin * 2,
          align: 'left',
          lineBreak: false,
        });

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#666666')
        .text(
          `Page ${pageNum} of ${range.count}`,
          PDF_LAYOUT.margin,
          PDF_LAYOUT.pageHeight - PDF_LAYOUT.margin / 2 - 10,
          {
            width: PDF_LAYOUT.pageWidth - PDF_LAYOUT.margin * 2,
            align: 'center',
            lineBreak: false,
          },
        );
    }
  }

  ensureSpace(
    doc: PdfDoc,
    state: PdfLayoutState,
    requiredHeight: number,
  ): void {
    const bottomLimit =
      PDF_LAYOUT.pageHeight - PDF_LAYOUT.margin - PDF_LAYOUT.footerHeight;

    if (state.y + requiredHeight <= bottomLimit) return;

    doc.addPage();
    state.pageNumber += 1;
    state.y = PDF_LAYOUT.margin + PDF_LAYOUT.headerHeight;
  }
}

export const headerFooterService = new HeaderFooterService();

export const createPdfDocument = (title: string): PdfDoc =>
  new PDFDocument({
    size: 'A4',
    margins: {
      top: PDF_LAYOUT.margin,
      bottom: PDF_LAYOUT.margin,
      left: PDF_LAYOUT.margin,
      right: PDF_LAYOUT.margin,
    },
    bufferPages: true,
    info: {
      Title: title,
      Author: 'AccrediAssist',
      Creator: 'AccrediAssist Report Generator',
    },
  });

export const collectPdfBuffer = (doc: PdfDoc): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
