import {
  AlignmentType,
  Footer,
  Header,
  PageNumber,
  Paragraph,
  TextRun,
} from 'docx';
import { DOCX_TYPOGRAPHY } from '../config/docx.config';

export const buildDocumentHeader = (reportTitle: string): Header =>
  new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: reportTitle,
            font: DOCX_TYPOGRAPHY.fontFamily,
            size: 18,
            color: '666666',
          }),
        ],
      }),
    ],
  });

export const buildDocumentFooter = (): Footer =>
  new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: 'AccrediAssist | Page ',
            font: DOCX_TYPOGRAPHY.fontFamily,
            size: 18,
            color: '666666',
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            font: DOCX_TYPOGRAPHY.fontFamily,
            size: 18,
            color: '666666',
          }),
          new TextRun({
            text: ' of ',
            font: DOCX_TYPOGRAPHY.fontFamily,
            size: 18,
            color: '666666',
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            font: DOCX_TYPOGRAPHY.fontFamily,
            size: 18,
            color: '666666',
          }),
        ],
      }),
    ],
  });

export const buildSectionHeading = (text: string, level: 1 | 2 = 1): Paragraph => {
  const size = level === 1 ? DOCX_TYPOGRAPHY.heading1Size : DOCX_TYPOGRAPHY.heading2Size;
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        font: DOCX_TYPOGRAPHY.fontFamily,
        size,
        color: '1F3864',
      }),
    ],
  });
};

export const buildBodyParagraph = (text: string): Paragraph =>
  new Paragraph({
    spacing: { after: 120, line: DOCX_TYPOGRAPHY.lineSpacing },
    children: [
      new TextRun({
        text,
        font: DOCX_TYPOGRAPHY.fontFamily,
        size: DOCX_TYPOGRAPHY.bodySize,
      }),
    ],
  });

export const buildBulletParagraph = (text: string): Paragraph =>
  new Paragraph({
    spacing: { after: 80 },
    bullet: { level: 0 },
    children: [
      new TextRun({
        text,
        font: DOCX_TYPOGRAPHY.fontFamily,
        size: DOCX_TYPOGRAPHY.bodySize,
      }),
    ],
  });

export const buildEmptySectionNotice = (sectionName: string): Paragraph =>
  buildBodyParagraph(
    `No ${sectionName} data was available for the selected report scope. This section has been omitted from detailed content.`,
  );
