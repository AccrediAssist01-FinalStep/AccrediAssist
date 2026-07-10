import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from './connection';
import { User } from '../models/User';
import { hashPassword } from '../utils/password';

dotenv.config();

const seedAdmin = async (): Promise<void> => {
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@accrediassist.edu';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@12345';

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
  try {
    await connectDatabase();
    await seedAdmin();
    console.log('Database seed completed');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runSeed();
