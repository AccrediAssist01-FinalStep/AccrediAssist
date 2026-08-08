import { RecordCategory } from '../database/enums';
import { BadRequestError } from '../utils/errors';

export type MoveModuleId = 'student' | 'faculty' | 'department';

export interface MoveDestinationMeta {
  category: RecordCategory;
  extractedDataPatch?: Record<string, unknown>;
}

export interface ResolvedMoveDestination extends MoveDestinationMeta {
  moduleId: MoveModuleId;
  submoduleId: string;
  label: string;
}

const SUBMODULE_LABELS: Record<MoveModuleId, Record<string, string>> = {
  student: {
    sports: 'Sports',
    cultural: 'Cultural',
    technical: 'Technical',
    research: 'Research',
    internship: 'Internship',
    placement: 'Placement',
    certifications: 'Certifications',
    workshops: 'Workshops',
    seminars: 'Seminars',
    'industrial-visits': 'Industrial Visits',
    'startup-innovation': 'Startup & Innovation',
    'nss-ncc': 'NSS / NCC',
  },
  faculty: {
    fdps: 'FDPs',
    'workshops-attended': 'Workshops Attended',
    'seminars-attended': 'Seminars Attended',
    conferences: 'Conferences',
    publications: 'Publications',
    patents: 'Patents',
    'book-chapters': 'Book Chapters',
    consultancy: 'Consultancy',
    'sponsored-projects': 'Sponsored Projects',
    certifications: 'Certifications',
    awards: 'Awards',
    'guest-lectures': 'Guest Lectures',
  },
  department: {
    events: 'Events',
    'industrial-visit-reports': 'Industrial Visit Reports',
    'department-achievements': 'Department Achievements',
  },
};

const SUBMODULE_MOVE_MAP: Record<MoveModuleId, Record<string, MoveDestinationMeta>> = {
  student: {
    sports: { category: 'Sports' },
    cultural: { category: 'Cultural' },
    technical: {
      category: 'Student Achievement',
      extractedDataPatch: { achievementType: 'Technical' },
    },
    research: { category: 'Research' },
    internship: { category: 'Internship' },
    placement: { category: 'Placement' },
    certifications: { category: 'Certification' },
    workshops: { category: 'Workshop' },
    seminars: { category: 'Seminar' },
    'industrial-visits': { category: 'Industrial Visit' },
    'startup-innovation': {
      category: 'Student Achievement',
      extractedDataPatch: { achievementType: 'Hackathon' },
    },
    'nss-ncc': {
      category: 'Cultural',
      extractedDataPatch: { activitySubCategory: 'NSS / NCC' },
    },
  },
  faculty: {
    fdps: { category: 'Workshop', extractedDataPatch: { eventType: 'FDP' } },
    'workshops-attended': { category: 'Workshop' },
    'seminars-attended': { category: 'Seminar' },
    conferences: {
      category: 'Faculty Achievement',
      extractedDataPatch: { achievementType: 'Research', activitySubCategory: 'Conference' },
    },
    publications: { category: 'Publication' },
    patents: { category: 'Patent' },
    'book-chapters': {
      category: 'Publication',
      extractedDataPatch: { activitySubCategory: 'Book Chapter' },
    },
    consultancy: {
      category: 'Faculty Achievement',
      extractedDataPatch: { achievementType: 'Award', activitySubCategory: 'Consultancy' },
    },
    'sponsored-projects': {
      category: 'Faculty Achievement',
      extractedDataPatch: { achievementType: 'Research', activitySubCategory: 'Sponsored Project' },
    },
    certifications: {
      category: 'Faculty Achievement',
      extractedDataPatch: { achievementType: 'Certification' },
    },
    awards: {
      category: 'Faculty Achievement',
      extractedDataPatch: { achievementType: 'Award' },
    },
    'guest-lectures': {
      category: 'Workshop',
      extractedDataPatch: { eventType: 'Guest Lecture' },
    },
  },
  department: {
    events: { category: 'Workshop' },
    'industrial-visit-reports': { category: 'Industrial Visit' },
    'department-achievements': {
      category: 'Faculty Achievement',
      extractedDataPatch: { activitySubCategory: 'Department Achievement' },
    },
  },
};

export const resolveMoveDestination = (
  moduleId: MoveModuleId,
  submoduleId: string,
): ResolvedMoveDestination => {
  const meta = SUBMODULE_MOVE_MAP[moduleId]?.[submoduleId];
  const label = SUBMODULE_LABELS[moduleId]?.[submoduleId];

  if (!meta || !label) {
    throw new BadRequestError('Invalid move destination selected');
  }

  return {
    moduleId,
    submoduleId,
    label,
    ...meta,
  };
};

const CATEGORY_ACHIEVEMENT_TYPE: Partial<Record<RecordCategory, string>> = {
  Sports: 'Sports',
  Cultural: 'Cultural',
  Certification: 'Certification',
  Research: 'Research',
  'Student Achievement': 'Technical',
  'Faculty Achievement': 'Award',
};

const CATEGORY_EVENT_TYPE: Partial<Record<RecordCategory, string>> = {
  Workshop: 'Workshop',
  Seminar: 'Seminar',
  'Industrial Visit': 'Industrial Visit',
};

export const buildMoveExtractedDataPatch = (
  destination: ResolvedMoveDestination,
): Record<string, unknown> => {
  const patch: Record<string, unknown> = { ...(destination.extractedDataPatch ?? {}) };

  if (!patch.achievementType && CATEGORY_ACHIEVEMENT_TYPE[destination.category]) {
    patch.achievementType = CATEGORY_ACHIEVEMENT_TYPE[destination.category];
  }

  if (!patch.eventType && CATEGORY_EVENT_TYPE[destination.category]) {
    patch.eventType = CATEGORY_EVENT_TYPE[destination.category];
    patch.reportType = CATEGORY_EVENT_TYPE[destination.category];
  }

  return patch;
};
