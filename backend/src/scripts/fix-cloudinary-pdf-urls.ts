/**
 * Re-upload PDFs that were incorrectly stored on Cloudinary as image resources.
 * Uses contentBase64 from pending records when available.
 *
 * Run: npx tsx src/scripts/fix-cloudinary-pdf-urls.ts
 */

import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { PendingRecord } from '../models/PendingRecord';
import { cloudinaryService } from '../services/cloudinary.service';

dotenv.config();

const isBrokenPdfUrl = (url: unknown): url is string =>
  typeof url === 'string' &&
  url.includes('/image/upload/') &&
  url.toLowerCase().includes('.pdf');

const replaceUrl = (value: unknown, oldUrl: string, newUrl: string): unknown => {
  if (typeof value === 'string' && value === oldUrl) {
    return newUrl;
  }
  if (Array.isArray(value)) {
    return value.map((item) => (item === oldUrl ? newUrl : item));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        replaceUrl(nested, oldUrl, newUrl),
      ]),
    );
  }
  return value;
};

const main = async (): Promise<void> => {
  await connectDatabase();

  const pendingRecords = await PendingRecord.find({
    'extractedData.mediaMetadata.contentBase64': { $exists: true, $ne: null },
  });

  let fixed = 0;

  for (const record of pendingRecords) {
    const extracted = record.extractedData ?? {};
    const metadata = extracted.mediaMetadata as
      | { contentBase64?: string; mimeType?: string; fileName?: string; secureUrl?: string }
      | undefined;
    const oldUrl =
      (typeof extracted.media === 'string' ? extracted.media : null) ??
      metadata?.secureUrl ??
      (Array.isArray(extracted.mediaReferences) ? extracted.mediaReferences[0] : null);

    if (!isBrokenPdfUrl(oldUrl) || !metadata?.contentBase64) {
      continue;
    }

    const upload = await cloudinaryService.uploadWhatsAppBuffer({
      buffer: Buffer.from(metadata.contentBase64, 'base64'),
      fileName: metadata.fileName ?? 'document.pdf',
      mediaType: 'pdf',
      mimeType: metadata.mimeType ?? 'application/pdf',
    });

    const newUrl = upload.secureUrl;
    record.extractedData = replaceUrl(extracted, oldUrl, newUrl) as typeof record.extractedData;
    await record.save();

    await CompletedEventReport.updateMany(
      { generatedReportUrl: oldUrl },
      { $set: { generatedReportUrl: newUrl } },
    );
    await CompletedEventReport.updateMany(
      { photoUrls: oldUrl },
      { $set: { photoUrls: [newUrl] } },
    );

    console.log(`Fixed pending ${record._id}: ${oldUrl} -> ${newUrl}`);
    fixed += 1;
  }

  console.log(`Re-uploaded ${fixed} broken PDF attachment(s).`);
  await disconnectDatabase();
};

main().catch(async (error) => {
  console.error(error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
