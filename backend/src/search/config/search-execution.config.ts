import { Model } from 'mongoose';
import { CompletedEventReport } from '../../models/CompletedEventReport';
import { FacultyAchievement } from '../../models/FacultyAchievement';
import { Internship } from '../../models/Internship';
import { Patent } from '../../models/Patent';
import { Placement } from '../../models/Placement';
import { Publication } from '../../models/Publication';
import { StudentAchievement } from '../../models/StudentAchievement';
import { IBaseDocument } from '../../types/base.types';
import { SmartSearchCollection } from './search-collections.config';

export interface SearchCollectionConfig {
  model: Model<IBaseDocument>;
  dateField: string;
  defaultSortField: string;
  textSearchFields: readonly string[];
  defaultProjection: readonly string[];
  summaryFields: readonly string[];
}

export const SEARCH_COLLECTION_CONFIG: Record<SmartSearchCollection, SearchCollectionConfig> = {
  placements: {
    model: Placement as Model<IBaseDocument>,
    dateField: 'joiningDate',
    defaultSortField: 'createdAt',
    textSearchFields: ['studentName', 'rollNumber', 'department', 'company', 'role', 'package'],
    defaultProjection: [
      '_id',
      'studentName',
      'rollNumber',
      'department',
      'company',
      'role',
      'package',
      'joiningDate',
      'createdAt',
    ],
    summaryFields: ['studentName', 'company', 'role'],
  },
  internships: {
    model: Internship as Model<IBaseDocument>,
    dateField: 'endDate',
    defaultSortField: 'createdAt',
    textSearchFields: ['studentName', 'rollNumber', 'company', 'role', 'duration'],
    defaultProjection: [
      '_id',
      'studentName',
      'rollNumber',
      'company',
      'role',
      'duration',
      'startDate',
      'endDate',
      'createdAt',
    ],
    summaryFields: ['studentName', 'company', 'role'],
  },
  student_achievements: {
    model: StudentAchievement as Model<IBaseDocument>,
    dateField: 'date',
    defaultSortField: 'createdAt',
    textSearchFields: [
      'studentName',
      'rollNumber',
      'department',
      'achievementType',
      'title',
      'description',
      'organization',
    ],
    defaultProjection: [
      '_id',
      'studentName',
      'rollNumber',
      'department',
      'achievementType',
      'title',
      'organization',
      'date',
      'createdAt',
    ],
    summaryFields: ['studentName', 'title', 'achievementType'],
  },
  faculty_achievements: {
    model: FacultyAchievement as Model<IBaseDocument>,
    dateField: 'date',
    defaultSortField: 'createdAt',
    textSearchFields: [
      'facultyName',
      'designation',
      'achievementType',
      'title',
      'description',
      'organization',
    ],
    defaultProjection: [
      '_id',
      'facultyName',
      'designation',
      'achievementType',
      'title',
      'organization',
      'date',
      'createdAt',
    ],
    summaryFields: ['facultyName', 'title', 'achievementType'],
  },
  completed_event_reports: {
    model: CompletedEventReport as Model<IBaseDocument>,
    dateField: 'date',
    defaultSortField: 'createdAt',
    textSearchFields: [
      'eventTitle',
      'eventType',
      'venue',
      'coordinator',
      'summary',
      'description',
    ],
    defaultProjection: [
      '_id',
      'eventTitle',
      'eventType',
      'date',
      'venue',
      'coordinator',
      'participants',
      'createdAt',
    ],
    summaryFields: ['eventTitle', 'eventType', 'venue'],
  },
  publications: {
    model: Publication as Model<IBaseDocument>,
    dateField: 'publicationDate',
    defaultSortField: 'createdAt',
    textSearchFields: [
      'facultyName',
      'paperTitle',
      'journal',
      'conference',
      'authors',
      'doi',
    ],
    defaultProjection: [
      '_id',
      'facultyName',
      'paperTitle',
      'journal',
      'conference',
      'authors',
      'publicationDate',
      'createdAt',
    ],
    summaryFields: ['facultyName', 'paperTitle', 'journal'],
  },
  patents: {
    model: Patent as Model<IBaseDocument>,
    dateField: 'filingDate',
    defaultSortField: 'createdAt',
    textSearchFields: ['patentTitle', 'inventors', 'patentNumber', 'status'],
    defaultProjection: [
      '_id',
      'patentTitle',
      'inventors',
      'patentNumber',
      'status',
      'filingDate',
      'createdAt',
    ],
    summaryFields: ['patentTitle', 'status'],
  },
};

export const FULL_TEXT_FILTER_KEYS = ['search', 'topic', 'query', 'q'] as const;
