import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from './connection';
import { User } from '../models/User';
import { hashPassword } from '../utils/password';

dotenv.config();

const SEED_CREDENTIALS_ERROR =
  'Seed failed: ADMIN_EMAIL and ADMIN_PASSWORD must be set (non-empty) for the one-time admin seed.';

export const requireAdminSeedCredentials = (): { adminEmail: string; adminPassword: string } => {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();

  if (!adminEmail || !adminPassword) {
    throw new Error(SEED_CREDENTIALS_ERROR);
  }

  return { adminEmail, adminPassword };
};

export const seedAdmin = async (): Promise<void> => {
  const { adminEmail, adminPassword } = requireAdminSeedCredentials();

  const existingAdmin = await User.findOne({ email: adminEmail });

  if (existingAdmin) {
    console.log('Admin user already exists');
    return;
  }

  const hashedPassword = await hashPassword(adminPassword);

  await User.create({
    name: 'System Administrator',
    email: adminEmail,
    password: hashedPassword,
    role: 'Admin',
    department: 'Administration',
    designation: 'Administrator',
    isActive: true,
  });

  console.log(`Admin user created: ${adminEmail}`);
};

const runSeed = async (): Promise<void> => {
  let exitCode = 0;

  try {
    await connectDatabase();
    await seedAdmin();
    console.log('Database seed completed');
  } catch (error) {
    exitCode = 1;
    if (error instanceof Error && error.message === SEED_CREDENTIALS_ERROR) {
      console.error(error.message);
    } else {
      console.error('Seed failed:', error);
    }
  } finally {
    await mongoose.disconnect();
    process.exit(exitCode);
  }
};

if (require.main === module) {
  void runSeed();
}
