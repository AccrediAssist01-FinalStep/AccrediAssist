import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';

dotenv.config();

// Work around Node.js SRV lookup failures on some Windows networks.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const srvUri = process.env.MONGODB_URI;
const standardUri = process.env.MONGODB_URI_STANDARD;

const testConnection = async (label: string, uri: string): Promise<boolean> => {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log(`PASS: ${label} connected (${mongoose.connection.host})`);
    await mongoose.disconnect();
    return true;
  } catch (error) {
    const record = error as { code?: string; message?: string };
    console.log(`FAIL: ${label} — ${record.code ?? 'error'}: ${record.message ?? String(error)}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    return false;
  }
};

const main = async (): Promise<void> => {
  if (!srvUri) {
    console.log('FAIL: MONGODB_URI is not set in backend/.env');
    process.exit(1);
  }

  console.log('=== MongoDB Connection Diagnostic ===\n');
  const srvWorks = await testConnection('SRV URI (mongodb+srv)', srvUri);

  if (standardUri) {
    await testConnection('Standard URI (MONGODB_URI_STANDARD)', standardUri);
  } else {
    console.log('INFO: MONGODB_URI_STANDARD not set — add a non-SRV URI if SRV DNS fails in Node.js');
  }

  process.exit(srvWorks ? 0 : 1);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
