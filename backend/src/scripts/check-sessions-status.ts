import dotenv from 'dotenv';
import dns from 'dns';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { EventReportSession } from '../models/EventReportSession';
import { PendingRecord } from '../models/PendingRecord';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const main = async (): Promise<void> => {
  await connectDatabase();

  const sessions = await EventReportSession.find({ groupName: /Final Step/i })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('_id status groupName messages errorMessage pendingRecordId createdAt lastMessageAt');

  console.log(`Recent EventReportSessions (${sessions.length}):`);
  sessions.forEach((s) => {
    console.log({
      id: s._id.toString(),
      status: s.status,
      messages: s.messages?.length ?? 0,
      error: s.errorMessage,
      pendingRecordId: s.pendingRecordId?.toString(),
      createdAt: s.createdAt?.toISOString(),
      lastMessageAt: s.lastMessageAt?.toISOString(),
    });
  });

  const needsReview = await PendingRecord.find({ status: 'Needs Review' })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('_id status category groupName createdAt extractedData.sourceType');

  console.log(`\nNeeds Review records (${needsReview.length}):`);
  needsReview.forEach((r) => {
    console.log({
      id: r._id.toString(),
      status: r.status,
      category: r.category,
      group: r.groupName,
      sourceType: r.extractedData?.sourceType,
      createdAt: r.createdAt?.toISOString(),
    });
  });

  await disconnectDatabase();
};

main().catch(async (e) => {
  console.error(e);
  await disconnectDatabase().catch(() => undefined);
  process.exit(1);
});
