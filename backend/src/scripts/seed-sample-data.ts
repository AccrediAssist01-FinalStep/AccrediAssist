/**
 * Seeds sample institutional data for dashboard and reports.
 * Safe to run multiple times — skips collections that already have records.
 *
 * Run: npm run seed:sample-data
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../database/connection';
import { AuditLog } from '../models/AuditLog';
import { FacultyAchievement } from '../models/FacultyAchievement';
import { Internship } from '../models/Internship';
import { Patent } from '../models/Patent';
import { PendingRecord } from '../models/PendingRecord';
import { Placement } from '../models/Placement';
import { Publication } from '../models/Publication';
import { StudentAchievement } from '../models/StudentAchievement';
import { User } from '../models/User';

dotenv.config();

const seedIfEmpty = async (): Promise<void> => {
  const createdAt = new Date('2026-07-15T12:00:00.000Z');
  const admin = await User.findOne({ email: process.env.ADMIN_EMAIL ?? 'admin@accrediassist.edu' });
  const adminUserId = admin?._id;

  const collections: Array<{ name: string; count: number }> = [];

  if ((await Placement.countDocuments()) === 0) {
    await Placement.insertMany([
      {
        studentName: 'Rahul Patil',
        company: 'TCS',
        department: 'Computer Science',
        joiningDate: new Date('2026-07-01'),
        createdAt,
      },
      {
        studentName: 'Ananya Deshmukh',
        company: 'Infosys',
        department: 'Information Technology',
        joiningDate: new Date('2026-07-05'),
        createdAt,
      },
    ]);
    collections.push({ name: 'Placements', count: 2 });
  }

  if ((await Internship.countDocuments()) === 0) {
    await Internship.insertMany([
      {
        studentName: 'Rahul Patil',
        company: 'Google',
        department: 'Computer Science',
        endDate: new Date('2026-07-10'),
        createdAt,
      },
      {
        studentName: 'Priya Nair',
        company: 'Microsoft',
        department: 'Electronics',
        endDate: new Date('2026-06-15'),
        createdAt: new Date('2026-06-15T12:00:00.000Z'),
      },
    ]);
    collections.push({ name: 'Internships', count: 2 });
  }

  if ((await StudentAchievement.countDocuments()) === 0) {
    await StudentAchievement.insertMany([
      {
        studentName: 'Vikram Singh',
        achievementType: 'Sports',
        title: 'Cricket Winner',
        date: new Date('2026-07-08'),
        photos: [],
        createdAt,
      },
    ]);
    collections.push({ name: 'Student Achievements', count: 1 });
  }

  if ((await FacultyAchievement.countDocuments()) === 0) {
    await FacultyAchievement.insertMany([
      {
        facultyName: 'Dr. Sharma',
        achievementType: 'Research',
        title: 'Best Paper Award',
        date: new Date('2026-07-02'),
        photos: [],
        createdAt,
      },
      {
        facultyName: 'Dr. Rao',
        achievementType: 'Award',
        title: 'Outstanding Faculty',
        date: new Date('2026-07-03'),
        createdAt,
      },
    ]);
    collections.push({ name: 'Faculty Achievements', count: 2 });
  }

  if ((await Publication.countDocuments()) === 0) {
    await Publication.insertMany([
      {
        facultyName: 'Dr. Sharma',
        paperTitle: 'AI in Education',
        authors: ['Dr. Sharma'],
        publicationDate: new Date('2026-07-04'),
        createdAt,
      },
    ]);
    collections.push({ name: 'Publications', count: 1 });
  }

  if ((await Patent.countDocuments()) === 0) {
    await Patent.insertMany([
      {
        patentTitle: 'Smart Attendance System',
        inventors: ['Dr. Sharma'],
        status: 'Granted',
        filingDate: new Date('2026-07-06'),
        createdAt,
      },
      {
        patentTitle: 'IoT Sensor',
        inventors: ['Dr. Rao'],
        status: 'Filed',
        filingDate: new Date('2026-07-07'),
        createdAt,
      },
    ]);
    collections.push({ name: 'Patents', count: 2 });
  }

  if ((await PendingRecord.countDocuments()) === 0) {
    await PendingRecord.insertMany([
      {
        originalMessage: 'Pending placement record',
        category: 'Placement',
        status: 'Pending',
        extractedData: { company: 'TCS' },
        confidenceScore: 80,
        createdAt,
      },
      {
        originalMessage: 'Needs review internship',
        category: 'Internship',
        status: 'Needs Review',
        extractedData: { company: 'Google' },
        confidenceScore: 70,
        createdAt,
      },
    ]);
    collections.push({ name: 'Pending Reviews', count: 2 });
  }

  if (adminUserId && (await AuditLog.countDocuments()) === 0) {
    await AuditLog.insertMany([
      {
        userId: adminUserId,
        action: 'CREATE',
        module: 'Placement',
        description: 'Created placement record',
        timestamp: new Date('2026-07-09T10:00:00.000Z'),
      },
      {
        userId: adminUserId,
        action: 'APPROVE',
        module: 'PendingRecord',
        description: 'Approved pending record',
        timestamp: new Date('2026-07-09T11:00:00.000Z'),
      },
    ]);
    collections.push({ name: 'Audit Logs', count: 2 });
  }

  if (collections.length === 0) {
    console.log('Sample data already exists — nothing to seed.');
    return;
  }

  console.log('Seeded sample data:');
  collections.forEach(({ name, count }) => console.log(`  - ${name}: ${count} records`));
};

const run = async (): Promise<void> => {
  try {
    await connectDatabase();
    await seedIfEmpty();
    console.log('\nSample data seed completed. Refresh the dashboard.');
  } catch (error) {
    console.error('Sample data seed failed:', error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
    await mongoose.disconnect();
    process.exit(0);
  }
};

run();
