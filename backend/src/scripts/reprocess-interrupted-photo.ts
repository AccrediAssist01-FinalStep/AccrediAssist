/**
 * Reprocess a WhatsApp image that was interrupted by a server restart.
 * Run: npx tsx src/scripts/reprocess-interrupted-photo.ts
 */

import dotenv from 'dotenv';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { pendingReviewWorkflowService } from '../services/pendingReviewWorkflow.service';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const AMAZON_INTERNSHIP_PHOTO =
  'https://res.cloudinary.com/ygyyjlhr/image/upload/v1785997373/accrediassist/whatsapp/2628e094-d635-46da-8e52-70ba6936bb8e_dtp63w.jpg';

const main = async (): Promise<void> => {
  await connectDatabase();

  const result = await pendingReviewWorkflowService.processIncomingWhatsAppMessage({
    groupName: 'Final Step',
    sender: 'SAHIL',
    message: '',
    timestamp: new Date(),
    media: AMAZON_INTERNSHIP_PHOTO,
    mediaMetadata: {
      mediaType: 'image',
      mimeType: 'image/jpeg',
      fileName: 'image.jpg',
      fileSize: 152168,
      tempFileId: '2628e094-d635-46da-8e52-70ba6936bb8e',
      downloadedAt: new Date(),
      secureUrl: AMAZON_INTERNSHIP_PHOTO,
      publicId: 'accrediassist/whatsapp/2628e094-d635-46da-8e52-70ba6936bb8e_dtp63w',
    },
  });

  if (!result) {
    console.log('Message was ignored by pipeline filters.');
    await disconnectDatabase();
    return;
  }

  console.log('Reprocessed successfully:');
  console.log('  Pending record ID:', result.pendingRecord._id);
  console.log('  Category:', result.recordCategory);
  console.log('  Status:', result.pendingStatus);
  console.log('  Confidence:', result.confidenceScore);
  console.log('  Student names:', result.stages.extraction.result.studentNames);

  await disconnectDatabase();
};

main().catch(async (error) => {
  console.error(error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
