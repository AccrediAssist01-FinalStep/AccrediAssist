/**
 * Admin seed script tests (credentials required, idempotency, password hashing).
 */

import { spawn } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { User } from '../models/User';
import { requireAdminSeedCredentials, seedAdmin } from '../database/seed';

dotenv.config();

const SEED_EMAIL = 'seed-admin-test@accrediassist.edu';
const SEED_PASSWORD = 'SeedTest@12345';

const assert = (condition: boolean, message: string): void => {
  if (!condition) {
    throw new Error(`FAIL: ${message}`);
  }
  console.log(`PASS: ${message}`);
};

const runSeedCli = (env: NodeJS.ProcessEnv): Promise<number> => {
  return new Promise((resolve, reject) => {
    const seedPath = path.resolve(__dirname, '../database/seed.ts');
    const child = spawn('npx', ['tsx', seedPath], {
      env: { ...process.env, ...env },
      shell: true,
      stdio: 'ignore',
    });

    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 1));
  });
};

const testRequireCredentials = (): void => {
  const originalEmail = process.env.ADMIN_EMAIL;
  const originalPassword = process.env.ADMIN_PASSWORD;

  delete process.env.ADMIN_EMAIL;
  delete process.env.ADMIN_PASSWORD;

  try {
    let threw = false;
    try {
      requireAdminSeedCredentials();
    } catch {
      threw = true;
    }
    assert(threw, 'requireAdminSeedCredentials rejects missing ADMIN_EMAIL and ADMIN_PASSWORD');
  } finally {
    if (originalEmail !== undefined) {
      process.env.ADMIN_EMAIL = originalEmail;
    }
    if (originalPassword !== undefined) {
      process.env.ADMIN_PASSWORD = originalPassword;
    }
  }
};

const cleanupSeedUser = async (): Promise<void> => {
  await User.deleteMany({ email: SEED_EMAIL });
};

const testSeedFlow = async (): Promise<void> => {
  const missingExitCode = await runSeedCli({
    ADMIN_EMAIL: '',
    ADMIN_PASSWORD: '',
  });
  assert(missingExitCode !== 0, 'Seed CLI exits non-zero when credentials are missing');

  process.env.ADMIN_EMAIL = SEED_EMAIL;
  process.env.ADMIN_PASSWORD = SEED_PASSWORD;

  await connectDatabase();
  await cleanupSeedUser();
  await seedAdmin();

  const created = await User.findOne({ email: SEED_EMAIL }).select('+password');
  assert(Boolean(created), 'Seed creates admin user when credentials are set');
  assert(
    Boolean(created?.password && await bcrypt.compare(SEED_PASSWORD, created.password)),
    'Seed stores bcrypt-hashed admin password',
  );

  const passwordHashBefore = created?.password;
  await seedAdmin();
  const afterSecondRun = await User.findOne({ email: SEED_EMAIL }).select('+password');
  assert(
    (await User.countDocuments({ email: SEED_EMAIL })) === 1,
    'Second seed run does not create duplicate admin',
  );
  assert(
    afterSecondRun?.password === passwordHashBefore,
    'Second seed run does not reset admin password hash',
  );

  await cleanupSeedUser();
  await disconnectDatabase();
};

const main = async (): Promise<void> => {
  console.log('Running admin seed tests...\n');
  testRequireCredentials();
  await testSeedFlow();
  console.log('\nAll admin seed tests passed.');
};

main().catch((error) => {
  console.error('\nAdmin seed tests failed:', error);
  process.exit(1);
});
