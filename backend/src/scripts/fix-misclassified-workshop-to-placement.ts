/**
 * Move misclassified Workshop / CompletedEventReport records to Placement.
 * Run: npx tsx src/scripts/fix-misclassified-workshop-to-placement.ts
 */

import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { PendingRecord } from '../models/PendingRecord';
import { CompletedEventReport } from '../models/CompletedEventReport';
import { Placement } from '../models/Placement';
import { inferCategoryFromEventReport } from '../ai/utils/event-routing.util';
import { mapPendingRecordToPlacement } from '../utils/pendingRecordApproval.mapper';
import { toStringValue } from '../ai/utils/duplicate-similarity.util';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const PLACEMENT_HINT =
  /\b(placement|placed|offer letter|nptel|fellowship|pre-doctoral|doctoral|achievement recognition|campus placement|job offer)\b/i;

const shouldReclassify = (record: {
  category?: string;
  originalMessage?: string;
  extractedData?: Record<string, unknown>;
}): boolean => {
  if (record.category !== 'Workshop') {
    return false;
  }

  const data = record.extractedData ?? {};
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
    return true;
  }

  return (
    inferCategoryFromEventReport({
      reportType: toStringValue(data.reportType) ?? toStringValue(data.activitySubCategory),
      title: toStringValue(data.title),
      organization: toStringValue(data.organization),
      summary: toStringValue(data.summary),
      aiGeneratedReport: toStringValue(data.aiGeneratedReport),
      keywords: Array.isArray(data.keywords) ? (data.keywords as string[]) : [],
    }) === 'Placement'
  );
};

const main = async (): Promise<void> => {
  await connectDatabase();

  const candidates = await PendingRecord.find({
    status: 'Approved',
    approvedTargetModule: 'CompletedEventReport',
    category: 'Workshop',
  }).lean();

  const toFix = candidates.filter((record) =>
    shouldReclassify({
      category: record.category,
      originalMessage: record.originalMessage,
      extractedData: record.extractedData as Record<string, unknown> | undefined,
    }),
  );

  console.log(`Found ${toFix.length} misclassified placement record(s)`);

  for (const record of toFix) {
    const eventReportId = record.approvedRecordId?.toString();
    if (!eventReportId) {
      console.warn(`- Skipping ${record._id}: no approvedRecordId`);
      continue;
    }

    const eventReport = await CompletedEventReport.findById(eventReportId);
    if (!eventReport) {
      console.warn(`- Skipping ${record._id}: CompletedEventReport ${eventReportId} not found`);
      continue;
    }

    const placementPayload = mapPendingRecordToPlacement(record as never);
    const placement = await Placement.create({
      ...placementPayload,
      approvedBy: eventReport.approvedBy,
    });

    await CompletedEventReport.deleteOne({ _id: eventReport._id });

    await PendingRecord.updateOne(
      { _id: record._id },
      {
        $set: {
          category: 'Placement',
          approvedTargetModule: 'Placement',
          approvedRecordId: placement._id,
          'extractedData.detectedCategory': 'Placement',
          'extractedData.eventType': 'Placement',
        },
      },
    );

    console.log(
      `- Fixed pending ${record._id}: CompletedEventReport ${eventReportId} -> Placement ${placement._id}`,
    );
  }

  await disconnectDatabase();
};

main().catch(async (error) => {
  console.error(error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
