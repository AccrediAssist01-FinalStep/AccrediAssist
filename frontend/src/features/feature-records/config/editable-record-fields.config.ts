export type EditableFieldType = 'text' | 'textarea' | 'date' | 'select' | 'number';

export interface EditableRecordField {
  key: string;
  label: string;
  type: EditableFieldType;
  options?: string[];
  required?: boolean;
}

const ACHIEVEMENT_TYPE_OPTIONS = [
  'Sports',
  'Technical',
  'Hackathon',
  'Research',
  'Certification',
  'Award',
  'Cultural',
];

const EVENT_TYPE_OPTIONS = [
  'Workshop',
  'Seminar',
  'Guest Lecture',
  'Industrial Visit',
  'FDP',
  'Training Program',
];

const PATENT_STATUS_OPTIONS = ['Filed', 'Published', 'Granted'];

const RESOURCE_TYPE_OPTIONS = [
  'Resource Person',
  'Invited Resource Person',
  'Expert',
  'Other',
];

const SESSION_ROLE_OPTIONS = ['Session Chair', 'Reviewer'];

const MOU_FIELDS: EditableRecordField[] = [
  { key: 'facultyName', label: 'Faculty Name', type: 'text', required: true },
  { key: 'organization', label: 'Company / Organization Name', type: 'text', required: true },
  { key: 'date', label: 'Date of MoU', type: 'date', required: true },
  { key: 'benefit', label: 'Benefit', type: 'textarea', required: true },
];

const RESOURCE_PERSON_FIELDS: EditableRecordField[] = [
  { key: 'facultyName', label: 'Faculty Name', type: 'text', required: true },
  { key: 'organization', label: 'College / University / Organization Name', type: 'text', required: true },
  {
    key: 'resourceType',
    label: 'Resource Type',
    type: 'select',
    options: RESOURCE_TYPE_OPTIONS,
    required: true,
  },
  { key: 'date', label: 'Date', type: 'date', required: true },
];

const SESSION_CHAIR_REVIEWER_FIELDS: EditableRecordField[] = [
  { key: 'facultyName', label: 'Faculty Name', type: 'text', required: true },
  { key: 'organization', label: 'Organization', type: 'text', required: true },
  {
    key: 'sessionRole',
    label: 'Type',
    type: 'select',
    options: SESSION_ROLE_OPTIONS,
    required: true,
  },
  { key: 'date', label: 'Date', type: 'date', required: true },
];

const STUDENT_SPONSORED_PROJECT_FIELDS: EditableRecordField[] = [
  { key: 'studentName', label: 'Student Name', type: 'text', required: true },
  { key: 'title', label: 'Project Name', type: 'text', required: true },
  { key: 'organization', label: 'Sponsored Organization', type: 'text', required: true },
  { key: 'sponsorshipAmount', label: 'Sponsorship Amount', type: 'number', required: true },
  { key: 'date', label: 'Date', type: 'date', required: true },
];

export const EDITABLE_RECORD_FIELDS: Record<string, EditableRecordField[]> = {
  '/event-reports': [
    { key: 'eventTitle', label: 'Event', type: 'text', required: true },
    { key: 'eventType', label: 'Type', type: 'select', options: EVENT_TYPE_OPTIONS, required: true },
    { key: 'coordinator', label: 'Coordinator', type: 'text' },
    { key: 'venue', label: 'Venue', type: 'text' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'summary', label: 'Summary', type: 'textarea' },
  ],
  '/faculty-achievements': [
    { key: 'facultyName', label: 'Faculty', type: 'text', required: true },
    {
      key: 'achievementType',
      label: 'Type',
      type: 'select',
      options: ACHIEVEMENT_TYPE_OPTIONS,
      required: true,
    },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'organization', label: 'Organization', type: 'text' },
    { key: 'date', label: 'Date', type: 'date', required: true },
  ],
  '/student-achievements': [
    { key: 'studentName', label: 'Student', type: 'text', required: true },
    {
      key: 'achievementType',
      label: 'Type',
      type: 'select',
      options: ACHIEVEMENT_TYPE_OPTIONS,
      required: true,
    },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'organization', label: 'Organization', type: 'text' },
    { key: 'date', label: 'Date', type: 'date', required: true },
  ],
  '/placements': [
    { key: 'studentName', label: 'Student', type: 'text', required: true },
    { key: 'company', label: 'Company', type: 'text', required: true },
    { key: 'role', label: 'Role', type: 'text' },
    { key: 'package', label: 'Package', type: 'text' },
    { key: 'joiningDate', label: 'Joining Date', type: 'date' },
  ],
  '/internships': [
    { key: 'studentName', label: 'Student', type: 'text', required: true },
    { key: 'company', label: 'Company', type: 'text', required: true },
    { key: 'role', label: 'Role', type: 'text' },
    { key: 'duration', label: 'Duration', type: 'text' },
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'endDate', label: 'End Date', type: 'date' },
  ],
  '/publications': [
    { key: 'facultyName', label: 'Faculty', type: 'text', required: true },
    { key: 'paperTitle', label: 'Paper Title', type: 'text', required: true },
    { key: 'journal', label: 'Journal', type: 'text' },
    { key: 'conference', label: 'Conference', type: 'text' },
    { key: 'publicationDate', label: 'Publication Date', type: 'date' },
  ],
  '/patents': [
    { key: 'patentTitle', label: 'Patent Title', type: 'text', required: true },
    { key: 'status', label: 'Status', type: 'select', options: PATENT_STATUS_OPTIONS, required: true },
    { key: 'inventors', label: 'Inventors (comma-separated)', type: 'text' },
    { key: 'patentNumber', label: 'Patent Number', type: 'text' },
    { key: 'filingDate', label: 'Filing Date', type: 'date' },
  ],
};

export const getEditableRecordFields = (apiPath: string, submoduleId?: string): EditableRecordField[] => {
  if (submoduleId === 'mous') {
    return MOU_FIELDS;
  }
  if (submoduleId === 'resource-person') {
    return RESOURCE_PERSON_FIELDS;
  }
  if (submoduleId === 'session-chair-reviewer') {
    return SESSION_CHAIR_REVIEWER_FIELDS;
  }
  if (submoduleId === 'sponsored-projects' && apiPath === '/student-achievements') {
    return STUDENT_SPONSORED_PROJECT_FIELDS;
  }

  return EDITABLE_RECORD_FIELDS[apiPath] ?? [];
};
