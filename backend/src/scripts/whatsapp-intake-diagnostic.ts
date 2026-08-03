/**
 * Quick WhatsApp intake diagnostic.
 * Run: npx tsx src/scripts/whatsapp-intake-diagnostic.ts
 */

import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';
import { whatsappConnectionManager } from '../whatsapp/connection.manager';
import { whatsappService } from '../whatsapp/whatsapp.service';
import { groupService } from '../whatsapp/group.service';
import { messageListener } from '../whatsapp/message.listener';
import { sessionService } from '../whatsapp/session.service';
import { EventReportSession } from '../models/EventReportSession';
import { PendingRecord } from '../models/PendingRecord';

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const run = async (): Promise<void> => {
  console.log('=== WhatsApp Intake Diagnostic ===\n');

  const hasSession = await sessionService.hasStoredSession();
  console.log(`Stored session: ${hasSession ? 'YES' : 'NO'}`);

  if (!hasSession) {
    console.log('\nFix: Stop backend, run "npm run whatsapp:connect", scan QR, then "npm run dev".');
    process.exit(1);
  }

  await whatsappConnectionManager.start();

  for (let attempt = 0; attempt < 15; attempt += 1) {
    if (whatsappService.isConnected() && messageListener.isListening()) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await whatsappService.ensureMessageListenerActive();
  }

  const status = await whatsappConnectionManager.getStatus();
  console.log(`Connected: ${status.isConnected ? 'YES' : 'NO'}`);
  console.log(`Message listener: ${status.isMessageListenerActive ? 'YES' : 'NO'}`);
  console.log(`Allowed groups: ${status.allowedGroups.join(', ')}`);

  if (!status.isConnected || !status.isMessageListenerActive) {
    console.log('\nWhatsApp is not fully active. Restart backend after pairing.');
    process.exit(1);
  }

  const groups = await groupService.getGroupDetectionStatus();
  console.log('\nJoined groups matching config:');
  groups.joinedAllowedGroups.forEach((group) => {
    console.log(`  ✓ ${group.name} (${group.participantCount} members)`);
  });

  if (groups.missingAllowedGroups.length > 0) {
    console.log('\nMissing allowed groups (bot phone must be IN these groups):');
    groups.missingAllowedGroups.forEach((name) => console.log(`  ✗ ${name}`));
  }

  await mongoose.connect(process.env.MONGODB_URI!);
  const activeSessions = await EventReportSession.countDocuments({ status: 'collecting' });
  const recentPending = await PendingRecord.countDocuments({
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });

  console.log(`\nActive event sessions: ${activeSessions}`);
  console.log(`Pending records (24h): ${recentPending}`);
  console.log('\nSend a test message in the allowed group with word "workshop".');
  console.log('Wait ~3 minutes after your last message for Pending Review to appear.');

  await mongoose.disconnect();
  await whatsappConnectionManager.stop();
  process.exit(0);
};

run().catch(async (error) => {
  console.error(error);
  await whatsappConnectionManager.stop().catch(() => undefined);
  process.exit(1);
});
