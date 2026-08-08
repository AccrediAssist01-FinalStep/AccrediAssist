import type { RecordCategory } from '@/types/api-models';
import { ERP_MODULES, type ErpModuleId } from '@/config/modules';

export interface MoveDestinationMeta {
  category: RecordCategory;
  extractedDataPatch?: Record<string, unknown>;
}

export interface MoveDestinationOption extends MoveDestinationMeta {
  moduleId: ErpModuleId;
  submoduleId: string;
  label: string;
}

const SUBMODULE_MOVE_MAP: Record<ErpModuleId, Record<string, MoveDestinationMeta>> = {
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

export const MOVE_MODULE_OPTIONS = ERP_MODULES.map((module) => ({
  id: module.id,
  label: module.label,
}));

export const getMoveDestinationsForModule = (moduleId: ErpModuleId): MoveDestinationOption[] => {
  const module = ERP_MODULES.find((item) => item.id === moduleId);
  const mapping = SUBMODULE_MOVE_MAP[moduleId];

  if (!module || !mapping) {
    return [];
  }

  return module.submodules
    .filter((submodule) => submodule.viewType === 'records' && mapping[submodule.id])
    .map((submodule) => ({
      moduleId,
      submoduleId: submodule.id,
      label: submodule.label,
      ...mapping[submodule.id],
    }));
};

export const resolveMoveDestination = (
  moduleId: ErpModuleId,
  submoduleId: string,
): MoveDestinationOption | null => {
  return (
    getMoveDestinationsForModule(moduleId).find((option) => option.submoduleId === submoduleId) ??
    null
  );
};

export const resolveCurrentMoveDestination = (
  record: {
    category: RecordCategory;
    approvedTargetModule?: string;
    extractedData?: Record<string, unknown>;
  },
): Pick<MoveDestinationOption, 'moduleId' | 'submoduleId'> | null => {
  const data = record.extractedData ?? {};
  const achievementType = String(data.achievementType ?? '');
  const eventType = String(data.eventType ?? data.reportType ?? '');
  const activitySubCategory = String(data.activitySubCategory ?? '');
  const moveModule = data.moveDestinationModule as ErpModuleId | undefined;
  const moveSubmodule = data.moveDestinationSubmodule as string | undefined;

  if (moveModule && moveSubmodule) {
    return { moduleId: moveModule, submoduleId: moveSubmodule };
  }

  const target = record.approvedTargetModule;

  if (target === 'Placement') {
    return { moduleId: 'student', submoduleId: 'placement' };
  }
  if (target === 'Internship') {
    return { moduleId: 'student', submoduleId: 'internship' };
  }
  if (target === 'Publication') {
    return activitySubCategory.includes('Book Chapter')
      ? { moduleId: 'faculty', submoduleId: 'book-chapters' }
      : { moduleId: 'faculty', submoduleId: 'publications' };
  }
  if (target === 'Patent') {
    return { moduleId: 'faculty', submoduleId: 'patents' };
  }

  if (target === 'CompletedEventReport') {
    if (eventType === 'FDP') return { moduleId: 'faculty', submoduleId: 'fdps' };
    if (eventType === 'Guest Lecture') return { moduleId: 'faculty', submoduleId: 'guest-lectures' };
    if (record.category === 'Seminar' || eventType === 'Seminar') {
      return record.category === 'Seminar' && !achievementType
        ? { moduleId: 'student', submoduleId: 'seminars' }
        : { moduleId: 'faculty', submoduleId: 'seminars-attended' };
    }
    if (record.category === 'Industrial Visit' || eventType === 'Industrial Visit') {
      return activitySubCategory.includes('Department') || data.sourceType === 'ai-event-report'
        ? { moduleId: 'department', submoduleId: 'industrial-visit-reports' }
        : { moduleId: 'student', submoduleId: 'industrial-visits' };
    }
    if (record.category === 'Workshop' || eventType === 'Workshop') {
      return achievementType
        ? { moduleId: 'faculty', submoduleId: 'workshops-attended' }
        : { moduleId: 'student', submoduleId: 'workshops' };
    }
    return { moduleId: 'department', submoduleId: 'events' };
  }

  if (target === 'StudentAchievement') {
    if (record.category === 'Sports') {
      return { moduleId: 'student', submoduleId: 'sports' };
    }
    if (record.category === 'Cultural') {
      return activitySubCategory.includes('NSS')
        ? { moduleId: 'student', submoduleId: 'nss-ncc' }
        : { moduleId: 'student', submoduleId: 'cultural' };
    }
    if (record.category === 'Certification') {
      return { moduleId: 'student', submoduleId: 'certifications' };
    }
    if (record.category === 'Research') {
      return { moduleId: 'student', submoduleId: 'research' };
    }
    if (record.category === 'Student Achievement') {
      if (achievementType === 'Hackathon') {
        return { moduleId: 'student', submoduleId: 'startup-innovation' };
      }
      return { moduleId: 'student', submoduleId: 'technical' };
    }

    if (achievementType === 'Sports') {
      return { moduleId: 'student', submoduleId: 'sports' };
    }
    if (achievementType === 'Cultural') {
      return { moduleId: 'student', submoduleId: 'cultural' };
    }
    if (achievementType === 'Certification') {
      return { moduleId: 'student', submoduleId: 'certifications' };
    }
    if (achievementType === 'Research') {
      return { moduleId: 'student', submoduleId: 'research' };
    }
    if (achievementType === 'Hackathon') {
      return { moduleId: 'student', submoduleId: 'startup-innovation' };
    }
    if (achievementType === 'Technical') {
      return { moduleId: 'student', submoduleId: 'technical' };
    }

    return { moduleId: 'student', submoduleId: 'technical' };
  }

  if (target === 'FacultyAchievement') {
    if (activitySubCategory.includes('Department')) {
      return { moduleId: 'department', submoduleId: 'department-achievements' };
    }
    if (activitySubCategory.includes('Sponsored')) {
      return { moduleId: 'faculty', submoduleId: 'sponsored-projects' };
    }
    if (activitySubCategory.includes('Conference')) {
      return { moduleId: 'faculty', submoduleId: 'conferences' };
    }
    if (activitySubCategory.includes('Consultancy')) {
      return { moduleId: 'faculty', submoduleId: 'consultancy' };
    }
    if (activitySubCategory.includes('Book Chapter')) {
      return { moduleId: 'faculty', submoduleId: 'book-chapters' };
    }
    if (record.category === 'Publication') {
      return { moduleId: 'faculty', submoduleId: 'publications' };
    }
    if (record.category === 'Faculty Achievement') {
      if (achievementType === 'Certification') {
        return { moduleId: 'faculty', submoduleId: 'certifications' };
      }
      if (achievementType === 'Award') {
        return { moduleId: 'faculty', submoduleId: 'awards' };
      }
      if (achievementType === 'Research') {
        const haystack = [
          data.title,
          data.description,
          data.organization,
          data.conference,
          data.eventName,
        ]
          .filter(Boolean)
          .join(' ');
        if (/conference/i.test(haystack)) {
          return { moduleId: 'faculty', submoduleId: 'conferences' };
        }
        return { moduleId: 'faculty', submoduleId: 'awards' };
      }
      return { moduleId: 'faculty', submoduleId: 'awards' };
    }
    if (achievementType === 'Certification') {
      return { moduleId: 'faculty', submoduleId: 'certifications' };
    }
    if (achievementType === 'Award') {
      return { moduleId: 'faculty', submoduleId: 'awards' };
    }
    return { moduleId: 'faculty', submoduleId: 'awards' };
  }

  return null;
};

export const isSameMoveDestination = (
  current: Pick<MoveDestinationOption, 'moduleId' | 'submoduleId'> | null,
  next: Pick<MoveDestinationOption, 'moduleId' | 'submoduleId'>,
): boolean =>
  Boolean(current &&
    current.moduleId === next.moduleId &&
    current.submoduleId === next.submoduleId);
