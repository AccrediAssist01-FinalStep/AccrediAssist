/**
 * Move misclassified Placement records that are actually event reports.
 * Run: npx tsx src/scripts/fix-misclassified-placement-to-event.ts
 */

import dotenv from 'dotenv';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { PendingRecord } from '../models/PendingRecord';
import { Placement } from '../models/Placement';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { inferCategoryFromEventReport } from '../ai/utils/event-routing.util';
import { mapPendingRecordToCompletedEventReport } from '../utils/pendingRecordApproval.mapper';
import { toStringValue } from '../ai/utils/duplicate-similarity.util';
import type { RecordCategory } from '../database/enums';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const EVENT_CATEGORIES = new Set<RecordCategory>(['Workshop', 'Seminar', 'Industrial Visit']);

const PLACEMENT_HINT =
  /\b(placement|placed|offer letter|nptel|fellowship|pre-doctoral|doctoral|achievement recognition|campus placement|job offer|salary package|lpa|ctc)\b/i;

const inferCorrectCategory = (record: {
  originalMessage?: string;
  extractedData?: Record<string, unknown>;
}): RecordCategory | null => {
  const data = record.extractedData ?? {};
  if (data.sourceType !== 'ai-event-report') {
    return null;
  }

  const haystack = [
    record.originalMessage,
    toStringValue(data.title),
    toStringValue(data.reportType),
    toStringValue(data.activitySubCategory),
    toStringValue(data.aiGeneratedReport),
    toStringValue(data.summary),
  ]
    .filter(Boolean)
    .join(' ');

  if (PLACEMENT_HINT.test(haystack)) {
    return null;
  }

  const category = inferCategoryFromEventReport({
    reportType: toStringValue(data.reportType) ?? toStringValue(data.activitySubCategory),
    title: toStringValue(data.title) ?? toStringValue(data.eventName),
    organization: toStringValue(data.organization),
    summary: toStringValue(data.summary),
    aiGeneratedReport: toStringValue(data.aiGeneratedReport),
    keywords: Array.isArray(data.keywords) ? (data.keywords as string[]) : [],
  });

  return EVENT_CATEGORIES.has(category) ? category : null;
};

const main = async (): Promise<void> => {
  await connectDatabase();

  const candidates = await PendingRecord.find({
    status: 'Approved',
    category: 'Placement',
    approvedTargetModule: 'Placement',
  }).lean();

  const toFix = candidates.filter((record) => inferCorrectCategory(record) !== null);

  console.log(`Found ${toFix.length} misclassified event report(s) in Placement`);

  for (const record of toFix) {
    const correctCategory = inferCorrectCategory(record)!;
    const placementId = record.approvedRecordId?.toString();
    if (!placementId) {
      console.warn(`- Skipping ${record._id}: no approvedRecordId`);
      continue;
    }

    const wrongPlacement = await Placement.findById(placementId);
    if (!wrongPlacement) {
      console.warn(`- Skipping ${record._id}: Placement ${placementId} not found`);
      continue;
    }

    const eventPayload = mapPendingRecordToCompletedEventReport({
      ...record,
      category: correctCategory,
    } as never);

    const eventReport = await CompletedEventReport.create({
      ...eventPayload,
      approvedBy: wrongPlacement.approvedBy,
    });

    await Placement.deleteOne({ _id: wrongPlacement._id });

    await PendingRecord.updateOne(
      { _id: record._id },
      {
        $set: {
          category: correctCategory,
          approvedTargetModule: 'CompletedEventReport',
          approvedRecordId: eventReport._id,
          'extractedData.detectedCategory': correctCategory,
          'extractedData.eventType': correctCategory,
        },
      },
    );

    console.log(
      `- Fixed pending ${record._id}: Placement ${placementId} -> ${correctCategory} ${eventReport._id}`,
    );
  }

  await disconnectDatabase();
};

main().catch(async (error) => {
  console.error(error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
