import { ImageRun, Paragraph } from 'docx';
import { CompletedEventReport } from '../../../models/CompletedEventReport';
import type { ReportGenerationFilters } from '../../interfaces/report-generation.interface';
import type { EventImageAsset } from '../interfaces/docx-report.interface';
import { buildBodyParagraph, buildSectionHeading } from '../utils/header-footer.util';
import { mapToAggregationFilters } from '../../utils/filter-mapper.util';
import {
  fetchExternalBuffer,
  mapImageContentTypeToDocxType,
} from '../../utils/safe-fetch.util';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 6;
const TARGET_WIDTH = 480;
const TARGET_HEIGHT = 320;

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

const fetchImageBuffer = async (
  url: string,
): Promise<{ buffer: Buffer; contentType: string } | null> =>
  fetchExternalBuffer(url, { maxBytes: MAX_IMAGE_BYTES, timeoutMs: 15000 });

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
      const fetched = await fetchImageBuffer(asset.url);
      if (!fetched) continue;
      const imageType = mapImageContentTypeToDocxType(fetched.contentType);
      if (!imageType) continue;

      prepared.push({
        ...asset,
        buffer: fetched.buffer,
        imageType,
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
              type: asset.imageType ?? 'png',
            }),
          ],
        }),
      );
    }

    return paragraphs;
  }
}

export const imageInserter = new ImageInserter();
