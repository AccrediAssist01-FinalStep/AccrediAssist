import { ImageRun, Paragraph } from 'docx';
import { logger } from '../../../utils/logger';
import { CompletedEventReport } from '../../../models/CompletedEventReport';
import type { ReportGenerationFilters } from '../../interfaces/report-generation.interface';
import type { EventImageAsset } from '../interfaces/docx-report.interface';
import { buildBodyParagraph, buildSectionHeading } from '../utils/header-footer.util';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 6;
const TARGET_WIDTH = 480;
const TARGET_HEIGHT = 320;

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
    logger.warn('Failed to fetch event image for DOCX report', {
      url,
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return null;
  }
};

export class ImageInserter {
  async loadEventImages(filters: ReportGenerationFilters): Promise<EventImageAsset[]> {
    const events = await CompletedEventReport.find(buildDateFilter(filters))
      .select('eventTitle photoUrls')
      .sort({ date: -1 })
      .limit(10)
      .lean<Array<{ eventTitle: string; photoUrls?: string[] }>>();

    const assets: EventImageAsset[] = [];

    for (const event of events) {
      for (const url of event.photoUrls ?? []) {
        if (!url || assets.length >= MAX_IMAGES) continue;
        assets.push({ eventTitle: event.eventTitle, url });
      }
    }

    return assets;
  }

  async prepareImages(filters: ReportGenerationFilters): Promise<EventImageAsset[]> {
    const assets = await this.loadEventImages(filters);

    const prepared: EventImageAsset[] = [];
    for (const asset of assets) {
      const buffer = await fetchImageBuffer(asset.url);
      if (!buffer) continue;
      prepared.push({
        ...asset,
        buffer,
        width: TARGET_WIDTH,
        height: TARGET_HEIGHT,
      });
    }

    return prepared;
  }

  insertImages(assets: EventImageAsset[]): Paragraph[] {
    if (assets.length === 0) {
      return [buildBodyParagraph('No event photographs were available for the selected report scope.')];
    }

    const paragraphs: Paragraph[] = [];

    for (const asset of assets) {
      if (!asset.buffer) continue;

      paragraphs.push(buildSectionHeading(asset.eventTitle, 2));

      paragraphs.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new ImageRun({
              data: asset.buffer,
              transformation: {
                width: asset.width ?? TARGET_WIDTH,
                height: asset.height ?? TARGET_HEIGHT,
              },
              type: 'png',
            }),
          ],
        }),
      );
    }

    return paragraphs;
  }
}

export const imageInserter = new ImageInserter();
