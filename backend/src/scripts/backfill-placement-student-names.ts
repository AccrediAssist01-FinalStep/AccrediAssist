/**
 * Backfill student names on approved placement records from image/PDF observations.
 * Run: npx tsx src/scripts/backfill-placement-student-names.ts
 */

import dotenv from 'dotenv';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { PendingRecord } from '../models/PendingRecord';
import { Placement } from '../models/Placement';
import { resolvePrimaryStudentName } from '../ai/utils/student-name-inference.util';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const main = async (): Promise<void> => {
  await connectDatabase();

  const records = await PendingRecord.find({
    category: 'Placement',
    approvedTargetModule: 'Placement',
    status: 'Approved',
  }).lean();

  let updated = 0;

  for (const record of records) {
    const data = (record.extractedData ?? {}) as Record<string, unknown>;
    const studentName = resolvePrimaryStudentName(data);
    if (!studentName) {
      continue;
    }

    const placementId = record.approvedRecordId?.toString();
    if (!placementId) {
      continue;
    }

    const placement = await Placement.findById(placementId);
    if (!placement || placement.studentName?.trim()) {
      continue;
    }

    placement.studentName = studentName;
    await placement.save();

    await PendingRecord.updateOne(
      { _id: record._id },
      {
        $set: {
          'extractedData.studentName': studentName,
          'extractedData.studentNames': [studentName],
        },
      },
    );

    console.log(`- Updated placement ${placementId}: ${studentName}`);
    updated += 1;
  }

  console.log(`Backfilled ${updated} placement record(s)`);
  await disconnectDatabase();
};

main().catch(async (error) => {
  console.error(error);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
