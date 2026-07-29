export interface FeatureSortOption {
  value: string;
  label: string;
}

export interface FeatureListProfile {
  defaultSortBy: string;
  defaultSortOrder: 'asc' | 'desc';
  sortOptions: FeatureSortOption[];
}

const ACHIEVEMENT_PROFILE: FeatureListProfile = {
  defaultSortBy: 'date',
  defaultSortOrder: 'desc',
  sortOptions: [
    { value: 'date', label: 'Activity Date' },
    { value: 'studentName', label: 'Student Name' },
    { value: 'achievementType', label: 'Type' },
    { value: 'department', label: 'Department' },
    { value: 'createdAt', label: 'Date Added' },
  ],
};

const FACULTY_ACHIEVEMENT_PROFILE: FeatureListProfile = {
  defaultSortBy: 'date',
  defaultSortOrder: 'desc',
  sortOptions: [
    { value: 'date', label: 'Activity Date' },
    { value: 'facultyName', label: 'Faculty Name' },
    { value: 'achievementType', label: 'Type' },
    { value: 'designation', label: 'Designation' },
    { value: 'createdAt', label: 'Date Added' },
  ],
};

const PLACEMENT_PROFILE: FeatureListProfile = {
  defaultSortBy: 'joiningDate',
  defaultSortOrder: 'desc',
  sortOptions: [
    { value: 'joiningDate', label: 'Joining Date' },
    { value: 'studentName', label: 'Student Name' },
    { value: 'company', label: 'Company' },
    { value: 'department', label: 'Department' },
    { value: 'createdAt', label: 'Date Added' },
  ],
};

const INTERNSHIP_PROFILE: FeatureListProfile = {
  defaultSortBy: 'startDate',
  defaultSortOrder: 'desc',
  sortOptions: [
    { value: 'startDate', label: 'Start Date' },
    { value: 'endDate', label: 'End Date' },
    { value: 'studentName', label: 'Student Name' },
    { value: 'company', label: 'Company' },
    { value: 'createdAt', label: 'Date Added' },
  ],
};

const EVENT_PROFILE: FeatureListProfile = {
  defaultSortBy: 'date',
  defaultSortOrder: 'desc',
  sortOptions: [
    { value: 'date', label: 'Event Date' },
    { value: 'eventTitle', label: 'Event Title' },
    { value: 'eventType', label: 'Event Type' },
    { value: 'createdAt', label: 'Date Added' },
  ],
};

const PUBLICATION_PROFILE: FeatureListProfile = {
  defaultSortBy: 'publicationDate',
  defaultSortOrder: 'desc',
  sortOptions: [
    { value: 'publicationDate', label: 'Publication Date' },
    { value: 'facultyName', label: 'Faculty Name' },
    { value: 'paperTitle', label: 'Paper Title' },
    { value: 'createdAt', label: 'Date Added' },
  ],
};

const PATENT_PROFILE: FeatureListProfile = {
  defaultSortBy: 'filingDate',
  defaultSortOrder: 'desc',
  sortOptions: [
    { value: 'filingDate', label: 'Filing Date' },
    { value: 'patentTitle', label: 'Patent Title' },
    { value: 'status', label: 'Status' },
    { value: 'createdAt', label: 'Date Added' },
  ],
};

const LIST_PROFILES: Record<string, FeatureListProfile> = {
  '/student-achievements': ACHIEVEMENT_PROFILE,
  '/faculty-achievements': FACULTY_ACHIEVEMENT_PROFILE,
  '/placements': PLACEMENT_PROFILE,
  '/internships': INTERNSHIP_PROFILE,
  '/event-reports': EVENT_PROFILE,
  '/publications': PUBLICATION_PROFILE,
  '/patents': PATENT_PROFILE,
};

export const getFeatureListProfile = (apiPath: string): FeatureListProfile =>
  LIST_PROFILES[apiPath] ?? {
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
    sortOptions: [
      { value: 'createdAt', label: 'Date Added' },
    ],
  };

export const buildYearOptions = (): Array<{ value: string; label: string }> => {
  const currentYear = new Date().getFullYear();
  const options = [{ value: 'all', label: 'All Years' }];

  for (let year = currentYear; year >= currentYear - 10; year -= 1) {
    options.push({ value: String(year), label: String(year) });
  }

  return options;
};

export const yearToDateRange = (
  year: number | 'all',
): { fromDate?: string; toDate?: string } => {
  if (year === 'all') {
    return {};
  }

  return {
    fromDate: new Date(year, 0, 1).toISOString(),
    toDate: new Date(year, 11, 31, 23, 59, 59, 999).toISOString(),
  };
};
