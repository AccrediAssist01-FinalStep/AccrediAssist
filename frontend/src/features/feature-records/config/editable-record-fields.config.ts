export type EditableFieldType = 'text' | 'textarea' | 'date' | 'select';

export interface EditableRecordField {
  key: string;
  label: string;
  type: EditableFieldType;
  options?: string[];
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

export const EDITABLE_RECORD_FIELDS: Record<string, EditableRecordField[]> = {
  '/event-reports': [
    { key: 'eventTitle', label: 'Event', type: 'text' },
    { key: 'eventType', label: 'Type', type: 'select', options: EVENT_TYPE_OPTIONS },
    { key: 'coordinator', label: 'Coordinator', type: 'text' },
    { key: 'venue', label: 'Venue', type: 'text' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'summary', label: 'Summary', type: 'textarea' },
  ],
  '/faculty-achievements': [
    { key: 'facultyName', label: 'Faculty', type: 'text' },
    { key: 'achievementType', label: 'Type', type: 'select', options: ACHIEVEMENT_TYPE_OPTIONS },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'organization', label: 'Organization', type: 'text' },
    { key: 'date', label: 'Date', type: 'date' },
  ],
  '/student-achievements': [
    { key: 'studentName', label: 'Student', type: 'text' },
    { key: 'achievementType', label: 'Type', type: 'select', options: ACHIEVEMENT_TYPE_OPTIONS },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'organization', label: 'Organization', type: 'text' },
    { key: 'date', label: 'Date', type: 'date' },
  ],
  '/placements': [
    { key: 'studentName', label: 'Student', type: 'text' },
    { key: 'company', label: 'Company', type: 'text' },
    { key: 'role', label: 'Role', type: 'text' },
    { key: 'package', label: 'Package', type: 'text' },
    { key: 'joiningDate', label: 'Joining Date', type: 'date' },
  ],
  '/internships': [
    { key: 'studentName', label: 'Student', type: 'text' },
    { key: 'company', label: 'Company', type: 'text' },
    { key: 'role', label: 'Role', type: 'text' },
    { key: 'duration', label: 'Duration', type: 'text' },
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'endDate', label: 'End Date', type: 'date' },
  ],
  '/publications': [
    { key: 'facultyName', label: 'Faculty', type: 'text' },
    { key: 'paperTitle', label: 'Paper Title', type: 'text' },
    { key: 'journal', label: 'Journal', type: 'text' },
    { key: 'conference', label: 'Conference', type: 'text' },
    { key: 'publicationDate', label: 'Publication Date', type: 'date' },
  ],
  '/patents': [
    { key: 'patentTitle', label: 'Patent Title', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: PATENT_STATUS_OPTIONS },
    { key: 'patentNumber', label: 'Patent Number', type: 'text' },
    { key: 'filingDate', label: 'Filing Date', type: 'date' },
  ],
};

export const getEditableRecordFields = (apiPath: string): EditableRecordField[] =>
  EDITABLE_RECORD_FIELDS[apiPath] ?? [];
