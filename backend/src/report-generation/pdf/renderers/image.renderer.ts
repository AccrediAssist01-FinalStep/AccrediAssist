import { CompletedEventReport } from '../../../models/CompletedEventReport';
import type { ReportGenerationFilters } from '../../interfaces/report-generation.interface';
import PDFDocument from 'pdfkit';
import type { PdfLayoutState, PdfEventImage } from '../interfaces/pdf-report.interface';
import { PDF_COLORS, PDF_LAYOUT, getContentWidth } from '../config/pdf.config';
import { headerFooterService } from '../utils/header-footer.util';
import { mapToAggregationFilters } from '../../utils/filter-mapper.util';
import { fetchExternalBuffer } from '../../utils/safe-fetch.util';

type PdfDoc = InstanceType<typeof PDFDocument>;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 6;
const MAX_DISPLAY_WIDTH = 460;

const buildDateFilter = (filters: ReportGenerationFilters): Record<string, unknown> => {
  const mapped = mapToAggregationFilters(filters);
  const match: Record<string, unknown> = {
    photoUrls: { $exists: true, $ne: [] },
  };

  if (mapped.department) {
    match.coordinator = { $regex: mapped.department, $options: 'i' };
  }

  if (mapped.startDate || mapped.endDate) {
    match.date = {};
    if (mapped.startDate) {
      (match.date as Record<string, Date>).$gte = mapped.startDate;
    }
    if (mapped.endDate) {
      (match.date as Record<string, Date>).$lte = mapped.endDate;
    }
  }

  return match;
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

        const fetched = await fetchExternalBuffer(url, {
          maxBytes: MAX_IMAGE_BYTES,
          timeoutMs: 15000,
        });
        if (!fetched) continue;

        prepared.push({
          eventTitle: event.eventTitle,
          url,
          buffer: fetched.buffer,
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
