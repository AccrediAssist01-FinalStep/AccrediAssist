import { Model } from 'mongoose';
import { CompletedEventReport } from '../../../models/CompletedEventReport';
import { FacultyAchievement } from '../../../models/FacultyAchievement';
import { Internship } from '../../../models/Internship';
import { Patent } from '../../../models/Patent';
import { PendingRecord } from '../../../models/PendingRecord';
import { Placement } from '../../../models/Placement';
import { Publication } from '../../../models/Publication';
import { StudentAchievement } from '../../../models/StudentAchievement';
import type {
  AggregationModuleKey,
  ModuleAggregationConfig,
} from '../interfaces/aggregation.interface';

export const MODULE_AGGREGATION_CONFIGS: Record<AggregationModuleKey, ModuleAggregationConfig> = {
  studentAchievements: {
    key: 'studentAchievements',
    label: 'Student Achievements',
    collection: 'student_achievements',
    dateField: 'date',
    departmentField: 'department',
    categoryField: 'achievementType',
    studentField: 'studentName',
    performerField: 'studentName',
    performerLabel: 'Student',
    statsOnly: false,
    latestLimit: 10,
    topLimit: 10,
    latestFields: {
      studentName: 1,
      department: 1,
      achievementType: 1,
      title: 1,
      date: 1,
      organization: 1,
      createdAt: 1,
    },
  },
  facultyAchievements: {
    key: 'facultyAchievements',
    label: 'Faculty Achievements',
    collection: 'faculty_achievements',
    dateField: 'date',
    categoryField: 'achievementType',
    facultyField: 'facultyName',
    performerField: 'facultyName',
    performerLabel: 'Faculty',
    statsOnly: false,
    latestLimit: 10,
    topLimit: 10,
    latestFields: {
      facultyName: 1,
      designation: 1,
      achievementType: 1,
      title: 1,
      date: 1,
      organization: 1,
      createdAt: 1,
    },
  },
  placements: {
    key: 'placements',
    label: 'Placements',
    collection: 'placements',
    dateField: 'joiningDate',
    departmentField: 'department',
    categoryField: 'company',
    studentField: 'studentName',
    performerField: 'studentName',
    performerLabel: 'Student',
    statsOnly: false,
    latestLimit: 10,
    topLimit: 10,
    latestFields: {
      studentName: 1,
      department: 1,
      company: 1,
      role: 1,
      package: 1,
      joiningDate: 1,
      createdAt: 1,
    },
  },
  internships: {
    key: 'internships',
    label: 'Internships',
    collection: 'internships',
    dateField: 'startDate',
    categoryField: 'company',
    studentField: 'studentName',
    performerField: 'studentName',
    performerLabel: 'Student',
    statsOnly: false,
    latestLimit: 10,
    topLimit: 10,
    latestFields: {
      studentName: 1,
      company: 1,
      role: 1,
      duration: 1,
      startDate: 1,
      endDate: 1,
      createdAt: 1,
    },
  },
  publications: {
    key: 'publications',
    label: 'Publications',
    collection: 'publications',
    dateField: 'publicationDate',
    categoryField: 'journal',
    facultyField: 'facultyName',
    performerField: 'facultyName',
    performerLabel: 'Faculty',
    statsOnly: false,
    latestLimit: 10,
    topLimit: 10,
    latestFields: {
      facultyName: 1,
      paperTitle: 1,
      journal: 1,
      conference: 1,
      publicationDate: 1,
      createdAt: 1,
    },
  },
  patents: {
    key: 'patents',
    label: 'Patents',
    collection: 'patents',
    dateField: 'filingDate',
    categoryField: 'status',
    performerField: 'patentTitle',
    performerLabel: 'Patent',
    statsOnly: false,
    latestLimit: 10,
    topLimit: 10,
    latestFields: {
      patentTitle: 1,
      inventors: 1,
      status: 1,
      filingDate: 1,
      patentNumber: 1,
      createdAt: 1,
    },
  },
  completedEventReports: {
    key: 'completedEventReports',
    label: 'Completed Event Reports',
    collection: 'completed_event_reports',
    dateField: 'date',
    categoryField: 'eventType',
    facultyField: 'coordinator',
    performerField: 'coordinator',
    performerLabel: 'Coordinator',
    statsOnly: false,
    latestLimit: 10,
    topLimit: 10,
    latestFields: {
      eventTitle: 1,
      eventType: 1,
      date: 1,
      venue: 1,
      coordinator: 1,
      participants: 1,
      createdAt: 1,
    },
  },
  pendingReviews: {
    key: 'pendingReviews',
    label: 'Pending Reviews',
    collection: 'pending_records',
    dateField: 'createdAt',
    categoryField: 'category',
    performerLabel: 'Category',
    statsOnly: true,
    latestLimit: 0,
    topLimit: 0,
    latestFields: {
      category: 1,
      status: 1,
      confidenceScore: 1,
      createdAt: 1,
    },
  },
};

export const MODULE_MODELS: Record<AggregationModuleKey, Model<unknown>> = {
  studentAchievements: StudentAchievement as Model<unknown>,
  facultyAchievements: FacultyAchievement as Model<unknown>,
  placements: Placement as Model<unknown>,
  internships: Internship as Model<unknown>,
  publications: Publication as Model<unknown>,
  patents: Patent as Model<unknown>,
  completedEventReports: CompletedEventReport as Model<unknown>,
  pendingReviews: PendingRecord as Model<unknown>,
};

export const getModuleConfig = (key: AggregationModuleKey): ModuleAggregationConfig =>
  MODULE_AGGREGATION_CONFIGS[key];

export const listModuleConfigs = (): ModuleAggregationConfig[] =>
  Object.values(MODULE_AGGREGATION_CONFIGS);

export const mapDataSourceToModuleKey = (dataSource: string): AggregationModuleKey | null => {
  const mapping: Record<string, AggregationModuleKey> = {
    studentAchievements: 'studentAchievements',
    facultyAchievements: 'facultyAchievements',
    placements: 'placements',
    internships: 'internships',
    publications: 'publications',
    patents: 'patents',
    completedEventReports: 'completedEventReports',
    pendingReviews: 'pendingReviews',
  };
  return mapping[dataSource] ?? null;
};
