/**
 * Auto-approve high-confidence AI event reports stuck in Needs Review.
 * Run: npx tsx src/scripts/auto-approve-pending-ai-reports.ts
 */

import dotenv from 'dotenv';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { PendingRecord } from '../models/PendingRecord';
import { getConfidenceThreshold } from '../ai/utils/pipeline-status.util';
import { pendingRecordAutoReviewService } from '../services/pendingRecordAutoReview.service';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const main = async (): Promise<void> => {
  await connectDatabase();

  const threshold = getConfidenceThreshold();
  const candidates = await PendingRecord.find({
    status: { $in: ['Pending', 'Needs Review'] },
    confidenceScore: { $gte: threshold },
    'extractedData.sourceType': 'ai-event-report',
  }).sort({ createdAt: -1 });

  console.log(`Threshold: ${threshold}%`);
  console.log(`Found ${candidates.length} AI event report(s) eligible for auto-approve`);

  for (const record of candidates) {
    try {
      const result = await pendingRecordAutoReviewService.resolveByConfidence(
        record._id.toString(),
        record.confidenceScore,
      );
      console.log(
        `- ${record._id} | ${record.category} | ${record.confidenceScore}% -> ${result.record.status} (${result.action})`,
      );
    } catch (error) {
      console.error(
        `- ${record._id} failed:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  await disconnectDatabase();
};

main().catch(async (error) => {
  console.error(error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
