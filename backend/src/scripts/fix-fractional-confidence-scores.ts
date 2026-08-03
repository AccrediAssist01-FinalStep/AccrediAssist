/**
 * Fix pending records stored with fractional confidence (0.95 instead of 95).
 * Run: npx tsx src/scripts/fix-fractional-confidence-scores.ts
 */

import dotenv from 'dotenv';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { PendingRecord } from '../models/PendingRecord';
import { normalizeConfidenceScore } from '../ai/utils/confidence-score.util';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const main = async (): Promise<void> => {
  await connectDatabase();

  const affected = await PendingRecord.find({
    confidenceScore: { $gt: 0, $lte: 1 },
  });

  console.log(`Found ${affected.length} record(s) with fractional confidence`);

  for (const record of affected) {
    const previous = record.confidenceScore;
    const fixed = normalizeConfidenceScore(previous);
    record.confidenceScore = fixed;
    await record.save();
    console.log(`- ${record._id}: ${previous} -> ${fixed}`);
  }

  await disconnectDatabase();
};

main().catch(async (error) => {
  console.error(error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
