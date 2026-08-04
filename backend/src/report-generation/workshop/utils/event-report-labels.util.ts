export type EventReportKind = 'workshop' | 'industrialVisit';

export interface EventReportLabels {
  kind: EventReportKind;
  proceedingsHeading: string;
  objectivesLeadIn: string;
  learningOutcomesLeadIn: string;
  photoGalleryHeading: string;
  filePrefix: string;
  defaultAcknowledgement: (department: string) => string;
  buildReportTitle: (eventTitle: string) => string;
}

export const resolveEventReportKind = (value: unknown): EventReportKind => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (
    normalized.includes('industrial') ||
    normalized.includes('field visit') ||
    normalized.includes('site visit')
  ) {
    return 'industrialVisit';
  }
  return 'workshop';
};

export const getEventReportLabels = (kind: EventReportKind): EventReportLabels => {
  if (kind === 'industrialVisit') {
    return {
      kind,
      proceedingsHeading: 'Visit Proceedings',
      objectivesLeadIn: 'The objectives of the industrial visit were:',
      learningOutcomesLeadIn: 'After the industrial visit, students were able to:',
      photoGalleryHeading: 'Industrial Visit Photographs',
      filePrefix: 'industrial-visit-report',
      defaultAcknowledgement: (department) =>
        `The ${department} extends its sincere gratitude to the industry host, accompanying faculty members, and participating students for their cooperation in making the industrial visit a successful and enriching experience.`,
      buildReportTitle: (eventTitle) => {
        const cleaned = eventTitle.replace(/^industrial visit (report )?(on )?/i, '').trim();
        return cleaned.toLowerCase().startsWith('industrial visit')
          ? eventTitle
          : `Industrial Visit Report on ${cleaned}`;
      },
    };
  }

  return {
    kind: 'workshop',
    proceedingsHeading: 'Workshop Proceedings',
    objectivesLeadIn: 'The objectives of the workshop were:',
    learningOutcomesLeadIn: 'After attending the workshop, students were able to:',
    photoGalleryHeading: 'Workshop Photographs',
    filePrefix: 'workshop-report',
    defaultAcknowledgement: (department) =>
      `The ${department} extends its sincere gratitude to the resource person, faculty members, and participating students for their cooperation and active involvement in making the workshop a successful event.`,
    buildReportTitle: (eventTitle) => {
      const cleaned = eventTitle.replace(/^workshop (report )?(on )?/i, '').trim();
      return cleaned.toLowerCase().startsWith('workshop')
        ? eventTitle
        : `Workshop Report on ${cleaned}`;
    },
  };
};

export const resolveEventReportKindFromCategory = (category: unknown): EventReportKind =>
  resolveEventReportKind(category);
