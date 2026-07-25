import { Model } from 'mongoose';
import { AuditLog } from '../../models/AuditLog';
import { CompletedEventReport } from '../../models/CompletedEventReport';
import { FacultyAchievement } from '../../models/FacultyAchievement';
import { Internship } from '../../models/Internship';
import { Patent } from '../../models/Patent';
import { PendingRecord } from '../../models/PendingRecord';
import { Placement } from '../../models/Placement';
import { Publication } from '../../models/Publication';
import { StudentAchievement } from '../../models/StudentAchievement';
import { IBaseDocument } from '../../types/base.types';
import {
  DashboardMonthlyStatistics,
  DashboardRecentActivity,
  DashboardYearlyStatistics,
} from '../interfaces/dashboard.interface';
import {
  ACTIVE_MATCH,
  buildMonthDateRange,
  buildYearDateRange,
  countPipeline,
  extractCount,
  studentNameProjectionPipeline,
} from '../utils/dashboard-aggregation.util';

const PENDING_REVIEW_STATUSES = ['Pending', 'Needs Review'];

const countDocuments = async <T extends IBaseDocument>(model: Model<T>): Promise<number> => {
  const result = await model.aggregate<{ total: number }>(countPipeline);
  return extractCount(result);
};

const countCreatedInRange = async <T extends IBaseDocument>(
  model: Model<T>,
  start: Date,
  end: Date,
): Promise<number> => {
  const result = await model.aggregate<{ total: number }>([
    {
      $match: {
        ...ACTIVE_MATCH,
        createdAt: { $gte: start, $lte: end },
      },
    },
    { $count: 'total' },
  ]);

  return extractCount(result);
};

export class DashboardRepository {
  async countUniqueStudents(): Promise<number> {
    const result = await Placement.aggregate<{ total: number }>([
      ...studentNameProjectionPipeline,
      {
        $unionWith: {
          coll: 'internships',
          pipeline: [...studentNameProjectionPipeline],
        },
      },
      {
        $unionWith: {
          coll: 'student_achievements',
          pipeline: [...studentNameProjectionPipeline],
        },
      },
      {
        $group: {
          _id: '$studentName',
        },
      },
      {
        $match: {
          _id: { $nin: [null, ''] },
        },
      },
      { $count: 'total' },
    ]);

    return extractCount(result);
  }

  async countFacultyAchievements(): Promise<number> {
    return countDocuments(FacultyAchievement);
  }

  async countPlacements(): Promise<number> {
    return countDocuments(Placement);
  }

  async countInternships(): Promise<number> {
    return countDocuments(Internship);
  }

  async countPublications(): Promise<number> {
    return countDocuments(Publication);
  }

  async countPatents(): Promise<number> {
    return countDocuments(Patent);
  }

  async countPendingReviews(): Promise<number> {
    const result = await PendingRecord.aggregate<{ total: number }>([
      {
        $match: {
          ...ACTIVE_MATCH,
          status: { $in: PENDING_REVIEW_STATUSES },
        },
      },
      { $count: 'total' },
    ]);

    return extractCount(result);
  }

  async getMonthlyStatistics(year: number, month: number): Promise<DashboardMonthlyStatistics> {
    const { start, end } = buildMonthDateRange(year, month);

    const [
      placements,
      internships,
      studentAchievements,
      facultyAchievements,
      publications,
      patents,
      eventReports,
      pendingReviews,
    ] = await Promise.all([
      countCreatedInRange(Placement, start, end),
      countCreatedInRange(Internship, start, end),
      countCreatedInRange(StudentAchievement, start, end),
      countCreatedInRange(FacultyAchievement, start, end),
      countCreatedInRange(Publication, start, end),
      countCreatedInRange(Patent, start, end),
      countCreatedInRange(CompletedEventReport, start, end),
      PendingRecord.aggregate<{ total: number }>([
        {
          $match: {
            ...ACTIVE_MATCH,
            status: { $in: PENDING_REVIEW_STATUSES },
            createdAt: { $gte: start, $lte: end },
          },
        },
        { $count: 'total' },
      ]).then(extractCount),
    ]);

    return {
      year,
      month,
      placements,
      internships,
      studentAchievements,
      facultyAchievements,
      publications,
      patents,
      pendingReviews,
      eventReports,
    };
  }

  async getYearlyStatistics(year: number): Promise<DashboardYearlyStatistics> {
    const { start, end } = buildYearDateRange(year);

    const collections = [
      Placement,
      Internship,
      StudentAchievement,
      FacultyAchievement,
      Publication,
      Patent,
      CompletedEventReport,
    ] as const;

    const monthlyCounts = await Promise.all(
      Array.from({ length: 12 }, async (_, index) => {
        const month = index + 1;
        const range = buildMonthDateRange(year, month);

        const counts = await Promise.all(
          collections.map((model) => countCreatedInRange(model, range.start, range.end)),
        );

        return {
          month,
          total: counts.reduce((sum, value) => sum + value, 0),
        };
      }),
    );

    const [
      placements,
      internships,
      studentAchievements,
      facultyAchievements,
      publications,
      patents,
      eventReports,
      pendingReviews,
    ] = await Promise.all([
      countCreatedInRange(Placement, start, end),
      countCreatedInRange(Internship, start, end),
      countCreatedInRange(StudentAchievement, start, end),
      countCreatedInRange(FacultyAchievement, start, end),
      countCreatedInRange(Publication, start, end),
      countCreatedInRange(Patent, start, end),
      countCreatedInRange(CompletedEventReport, start, end),
      PendingRecord.aggregate<{ total: number }>([
        {
          $match: {
            ...ACTIVE_MATCH,
            status: { $in: PENDING_REVIEW_STATUSES },
            createdAt: { $gte: start, $lte: end },
          },
        },
        { $count: 'total' },
      ]).then(extractCount),
    ]);

    return {
      year,
      placements,
      internships,
      studentAchievements,
      facultyAchievements,
      publications,
      patents,
      pendingReviews,
      eventReports,
      monthlyBreakdown: monthlyCounts,
    };
  }

  async getRecentActivities(limit: number): Promise<DashboardRecentActivity[]> {
    const records = await AuditLog.aggregate<{
      _id: { toString(): string };
      action: string;
      module: string;
      description?: string;
      timestamp: Date;
      userId?: { toString(): string };
    }>([
      { $match: ACTIVE_MATCH },
      { $sort: { timestamp: -1 } },
      { $limit: limit },
      {
        $project: {
          action: 1,
          module: 1,
          description: 1,
          timestamp: 1,
          userId: 1,
        },
      },
    ]);

    return records.map((record) => ({
      id: record._id.toString(),
      action: record.action,
      module: record.module,
      description: record.description,
      timestamp: record.timestamp,
      userId: record.userId?.toString(),
    }));
  }
}

export const dashboardRepository = new DashboardRepository();
