import { logger } from '../../../utils/logger';
import { CompletedEventReport } from '../../../models/CompletedEventReport';
import type { ReportGenerationFilters } from '../../interfaces/report-generation.interface';
import PDFDocument from 'pdfkit';
import type { PdfLayoutState, PdfEventImage } from '../interfaces/pdf-report.interface';
import { PDF_COLORS, PDF_LAYOUT, getContentWidth } from '../config/pdf.config';
import { headerFooterService } from '../utils/header-footer.util';

type PdfDoc = InstanceType<typeof PDFDocument>;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 6;
const MAX_DISPLAY_WIDTH = 460;

const buildDateFilter = (filters: ReportGenerationFilters): Record<string, unknown> => {
  const match: Record<string, unknown> = {
    photoUrls: { $exists: true, $ne: [] },
  };

  if (filters.department) {
    match.coordinator = { $regex: filters.department, $options: 'i' };
  }

  if (filters.startDate || filters.endDate) {
    match.date = {};
    if (filters.startDate) {
      (match.date as Record<string, Date>).$gte = filters.startDate;
    }
    if (filters.endDate) {
      (match.date as Record<string, Date>).$lte = filters.endDate;
    }
  }

  return match;
};

const fetchImageBuffer = async (url: string): Promise<Buffer | null> => {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) return null;

    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) return null;

    return Buffer.from(arrayBuffer);
  } catch (error) {
    logger.warn('Failed to fetch event image for PDF report', {
      url,
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return null;
  }
};

export class ImageRenderer {
  async prepareImages(filters: ReportGenerationFilters): Promise<PdfEventImage[]> {
    const events = await CompletedEventReport.find(buildDateFilter(filters))
      .select('eventTitle photoUrls')
      .sort({ date: -1 })
      .limit(10)
      .lean<Array<{ eventTitle: string; photoUrls?: string[] }>>();

    const prepared: PdfEventImage[] = [];

    for (const event of events) {
      for (const url of event.photoUrls ?? []) {
        if (!url || prepared.length >= MAX_IMAGES) continue;

        const buffer = await fetchImageBuffer(url);
        if (!buffer) continue;

        prepared.push({
          eventTitle: event.eventTitle,
          url,
          buffer,
          width: MAX_DISPLAY_WIDTH,
          height: Math.round(MAX_DISPLAY_WIDTH * 0.65),
        });
      }
    }

    return prepared;
  }

  render(
    doc: PdfDoc,
    state: PdfLayoutState,
    images: PdfEventImage[],
  ): void {
    if (images.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor(PDF_COLORS.secondary)
        .text('No event photographs were available for the selected report scope.', PDF_LAYOUT.margin, state.y);
      state.y += 24;
      return;
    }

    for (const image of images) {
      headerFooterService.ensureSpace(doc, state, image.height + 40);

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(PDF_COLORS.primary)
        .text(image.eventTitle, PDF_LAYOUT.margin, state.y, { width: getContentWidth() });
      state.y += 18;

      try {
        doc.image(image.buffer, PDF_LAYOUT.margin, state.y, {
          fit: [image.width, image.height],
          align: 'center',
        });
        state.y += image.height + 16;
      } catch {
        doc.font('Helvetica').fontSize(9).fillColor(PDF_COLORS.secondary)
          .text('Image could not be embedded.', PDF_LAYOUT.margin, state.y);
        state.y += 20;
      }
    }
  }
}

export const imageRenderer = new ImageRenderer();
