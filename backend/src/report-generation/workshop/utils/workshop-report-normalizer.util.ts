import {
  UNAVAILABLE_TEXT,
  WORKSHOP_REPORT_HEADINGS,
} from '../workshop-report-template.config';
import {
  WorkshopEventDetails,
  WorkshopImagePlacement,
  WorkshopReportStructuredContent,
} from '../workshop-report.types';
import { EventMediaItem } from '../../../types/eventReportSession.types';
import {
  EventReportKind,
  getEventReportLabels,
  resolveEventReportKind,
} from './event-report-labels.util';

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
};

const toNullableString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toParagraphs = (value: unknown): string[] => {
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/\n{2,}/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return toStringArray(value);
};

const normalizeEventDetails = (
  value: unknown,
  fallback: Record<string, unknown>,
): WorkshopEventDetails => {
  const record =
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

  const participantsRaw =
    record.participants ??
    fallback.participants ??
    (typeof fallback.participants === 'number' ? String(fallback.participants) : null);

  return {
    title:
      toNullableString(record.title) ??
      toNullableString(record.eventTitle) ??
      toNullableString(fallback.title) ??
      toNullableString(fallback.eventName),
    organizedBy:
      toNullableString(record.organizedBy) ??
      toNullableString(record.department) ??
      toNullableString(fallback.department),
    resourcePerson:
      toNullableString(record.resourcePerson) ??
      toNullableString(record.speaker) ??
      toNullableString(fallback.speaker),
    headOfDepartment:
      toNullableString(record.headOfDepartment) ??
      toNullableString(record.coordinator) ??
      toNullableString(fallback.coordinator),
    venue:
      toNullableString(record.venue) ??
      toNullableString(fallback.venue) ??
      toNullableString(fallback.location),
    date: toNullableString(record.date) ?? toNullableString(fallback.date),
    time: toNullableString(record.time) ?? toNullableString(fallback.time),
    participants:
      typeof participantsRaw === 'number'
        ? String(participantsRaw)
        : toNullableString(participantsRaw),
  };
};

const normalizeImagePlacements = (value: unknown): WorkshopImagePlacement[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const imageReference = toNullableString(record.imageReference ?? record.reference);
      const caption = toNullableString(record.caption ?? record.observation);
      if (!imageReference) return null;
      return {
        imageReference,
        section: 'evidenceGallery' as const,
        caption: caption ?? imageReference,
      };
    })
    .filter((item): item is WorkshopImagePlacement => item !== null);
};

const buildFallbackProceedings = (
  record: Record<string, unknown>,
  kind: EventReportKind,
): string[] => {
  const paragraphs: string[] = [];
  const speaker = toNullableString(record.speaker);
  const organization = toNullableString(record.organization);

  if (speaker) {
    paragraphs.push(
      kind === 'industrialVisit'
        ? `The visit was coordinated with ${speaker}${organization ? ` at ${organization}` : ''}.`
        : `The workshop featured ${speaker}${organization ? ` from ${organization}` : ''} as the resource person.`,
    );
  }

  paragraphs.push(...toStringArray(record.activitiesConducted));
  return paragraphs.filter(Boolean);
};

export const buildWorkshopReportFromGemini = (
  payload: Record<string, unknown>,
): WorkshopReportStructuredContent => {
  const reportKind = resolveEventReportKind(
    payload.reportType ?? payload.eventType ?? payload.category,
  );
  const labels = getEventReportLabels(reportKind);
  const workshopReport =
    payload.workshopReport && typeof payload.workshopReport === 'object'
      ? (payload.workshopReport as Record<string, unknown>)
      : payload;

  const title = toNullableString(workshopReport.title ?? payload.title);
  const department =
    toNullableString(workshopReport.departmentName ?? workshopReport.department ?? payload.department) ??
    null;

  const eventDetails = normalizeEventDetails(workshopReport.eventDetails, payload);

  const introduction = toParagraphs(workshopReport.introduction);
  const objectives = toStringArray(workshopReport.objectives ?? payload.objectives);
  const workshopProceedings =
    toParagraphs(workshopReport.workshopProceedings).length > 0
      ? toParagraphs(workshopReport.workshopProceedings)
      : buildFallbackProceedings({ ...payload, ...workshopReport }, reportKind);

  const speakerDetails = toParagraphs(workshopReport.speakerDetails);
  const scheduleSummary = toStringArray(workshopReport.scheduleSummary);
  const topicsCovered = toStringArray(
    workshopReport.topicsCovered ?? workshopReport.activitiesConducted ?? payload.activitiesConducted,
  );
  const activitiesConducted = toStringArray(
    workshopReport.activitiesConducted ?? payload.activitiesConducted,
  );
  const studentParticipation = toParagraphs(workshopReport.studentParticipation);
  const learningOutcomes = toStringArray(
    workshopReport.learningOutcomes ?? payload.learningOutcomes,
  );
  const keyHighlights = toStringArray(workshopReport.keyHighlights ?? payload.keyHighlights);
  const benefits = toStringArray(workshopReport.benefits);
  const conclusion = toParagraphs(workshopReport.conclusion ?? payload.conclusion);
  const acknowledgement = toParagraphs(workshopReport.acknowledgement);
  const aiExecutiveSummary =
    toNullableString(workshopReport.aiExecutiveSummary ?? payload.summary) ?? '';

  const imagePlacements = normalizeImagePlacements(workshopReport.imagePlacements);

  return {
    reportKind,
    departmentName: department,
    reportTitle:
      toNullableString(workshopReport.reportTitle) ??
      (title ? labels.buildReportTitle(title) : null),
    eventDetails,
    introduction,
    objectives,
    workshopProceedings: [...workshopProceedings, ...speakerDetails, ...studentParticipation],
    speakerDetails,
    scheduleSummary,
    topicsCovered,
    activitiesConducted,
    studentParticipation,
    learningOutcomes,
    keyHighlights,
    benefits,
    conclusion,
    acknowledgement,
    aiExecutiveSummary,
    imagePlacements,
    missingFields: toStringArray(workshopReport.missingFields ?? payload.missingFields),
  };
};

export const composeWorkshopPreviewText = (structured: WorkshopReportStructuredContent): string => {
  const eventDetails = structured.eventDetails;
  const detailLines = [
    structured.departmentName,
    structured.reportTitle,
    '',
    'Event Details :',
    `Title of the Event: ${eventDetails.title ?? UNAVAILABLE_TEXT}`,
    `Organized By: ${eventDetails.organizedBy ?? UNAVAILABLE_TEXT}`,
    `Resource Person: ${eventDetails.resourcePerson ?? UNAVAILABLE_TEXT}`,
    `Head of Department: ${eventDetails.headOfDepartment ?? UNAVAILABLE_TEXT}`,
    `Venue: ${eventDetails.venue ?? UNAVAILABLE_TEXT}`,
    `Date: ${eventDetails.date ?? UNAVAILABLE_TEXT}`,
    `Time: ${eventDetails.time ?? UNAVAILABLE_TEXT}`,
    `Participants: ${eventDetails.participants ?? UNAVAILABLE_TEXT}`,
  ].filter((line) => line !== null && line !== undefined);

  const sections: Array<[string, string[]]> = [
    [WORKSHOP_REPORT_HEADINGS.introduction, structured.introduction],
    [WORKSHOP_REPORT_HEADINGS.objectives, structured.objectives],
    [WORKSHOP_REPORT_HEADINGS.workshopProceedings, structured.workshopProceedings],
    [WORKSHOP_REPORT_HEADINGS.topicsCovered, structured.topicsCovered],
    [WORKSHOP_REPORT_HEADINGS.scheduleSummary, structured.scheduleSummary],
    [WORKSHOP_REPORT_HEADINGS.learningOutcomes, structured.learningOutcomes],
    [WORKSHOP_REPORT_HEADINGS.keyHighlights, structured.keyHighlights],
    [WORKSHOP_REPORT_HEADINGS.benefits, structured.benefits],
    [WORKSHOP_REPORT_HEADINGS.conclusion, structured.conclusion],
    [
      WORKSHOP_REPORT_HEADINGS.aiExecutiveSummary,
      structured.aiExecutiveSummary ? [structured.aiExecutiveSummary] : [],
    ],
    [WORKSHOP_REPORT_HEADINGS.acknowledgement, structured.acknowledgement],
  ];

  const body = sections
    .filter(([, content]) => content.length > 0)
    .map(([heading, content]) => `${heading}\n${content.join('\n')}`)
    .join('\n\n');

  return [detailLines.join('\n'), body].filter(Boolean).join('\n\n');
};

export const unavailableOr = (value: string | null | undefined): string =>
  value && value.trim() ? value.trim() : UNAVAILABLE_TEXT;

const formatEventDate = (value: unknown): string | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) return toNullableString(value);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const parsePreviewSections = (text: string): Record<string, string[]> => {
  const headings = Object.values(WORKSHOP_REPORT_HEADINGS).filter(
    (heading) => heading !== WORKSHOP_REPORT_HEADINGS.eventDetails,
  );
  const sections: Record<string, string[]> = {};
  let currentKey = 'introduction';
  const lines = text.split('\n');
  const currentLines: string[] = [];

  const flush = (): void => {
    if (currentLines.length > 0) {
      sections[currentKey] = [...(sections[currentKey] ?? []), currentLines.join('\n').trim()];
      currentLines.length = 0;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const matchedHeading = headings.find((heading) => heading === trimmed);
    if (matchedHeading) {
      flush();
      currentKey = Object.entries(WORKSHOP_REPORT_HEADINGS).find(
        ([, label]) => label === matchedHeading,
      )?.[0] ?? currentKey;
      continue;
    }
    if (trimmed) currentLines.push(trimmed);
  }
  flush();
  return sections;
};

export const buildWorkshopReportFromCompletedEvent = (
  event: Record<string, unknown>,
  defaultDepartment?: string,
): WorkshopReportStructuredContent => {
  if (event.workshopReportStructured && typeof event.workshopReportStructured === 'object') {
    const structured = event.workshopReportStructured as WorkshopReportStructuredContent;
    if (!structured.reportKind) {
      structured.reportKind = resolveEventReportKind(event.eventType ?? event.eventTitle);
    }
    return structured;
  }

  const reportKind = resolveEventReportKind(event.eventType ?? event.eventTitle);
  const labels = getEventReportLabels(reportKind);

  const description = toNullableString(event.description) ?? toNullableString(event.summary) ?? '';
  const parsedSections = description ? parsePreviewSections(description) : {};

  return buildWorkshopReportFromGemini({
    reportType: reportKind === 'industrialVisit' ? 'Industrial Visit' : 'Workshop',
    title: toNullableString(event.eventTitle),
    department: defaultDepartment,
    date: formatEventDate(event.date),
    venue: toNullableString(event.venue),
    coordinator: toNullableString(event.coordinator),
    participants: event.participants,
    summary: toNullableString(event.summary),
    aiGeneratedReport: description,
    objectives: parsedSections.objectives,
    learningOutcomes: parsedSections.learningOutcomes,
    keyHighlights: parsedSections.keyHighlights,
    benefits: parsedSections.benefits,
    conclusion: parsedSections.conclusion?.join('\n\n'),
    workshopReport: {
      departmentName: defaultDepartment,
      reportTitle: toNullableString(event.eventTitle)
        ? labels.buildReportTitle(String(event.eventTitle))
        : null,
      introduction: parsedSections.introduction,
      objectives: parsedSections.objectives,
      workshopProceedings: parsedSections.workshopProceedings,
      topicsCovered: parsedSections.topicsCovered,
      scheduleSummary: parsedSections.scheduleSummary,
      learningOutcomes: parsedSections.learningOutcomes,
      keyHighlights: parsedSections.keyHighlights,
      benefits: parsedSections.benefits,
      conclusion: parsedSections.conclusion,
      acknowledgement: parsedSections.acknowledgement,
      aiExecutiveSummary: parsedSections.aiExecutiveSummary?.join('\n\n') ?? toNullableString(event.summary),
      eventDetails: {
        title: toNullableString(event.eventTitle),
        organizedBy: defaultDepartment,
        resourcePerson: toNullableString(event.coordinator),
        venue: toNullableString(event.venue),
        date: formatEventDate(event.date),
        participants:
          typeof event.participants === 'number' ? String(event.participants) : null,
      },
    },
  });
};

export const getMediaFromCompletedEvent = (event: Record<string, unknown>): EventMediaItem[] => {
  if (Array.isArray(event.media) && event.media.length > 0) {
    return event.media as EventMediaItem[];
  }

  const photoUrls = Array.isArray(event.photoUrls)
    ? event.photoUrls.filter((url): url is string => typeof url === 'string' && url.length > 0)
    : [];

  return photoUrls.map((url, index) => ({
    type: 'image' as const,
    url,
    label: `Image ${index + 1}`,
    uploadedAt: new Date(),
  }));
};
