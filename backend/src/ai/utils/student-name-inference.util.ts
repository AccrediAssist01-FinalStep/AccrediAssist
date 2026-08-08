const NAME_BLOCKLIST = new Set([
  'Heartiest',
  'Your',
  'Mechanical',
  'Engineering',
  'Department',
  'Congratulations',
  'Keep',
  'Final',
  'National',
  'Board',
  'Successful',
  'Industry',
  'Visit',
  'Report',
  'Research',
  'Fellowship',
  'Certificate',
  'Recognition',
  'Achievement',
  'Pre',
  'Doctoral',
  'Indian',
  'Institute',
  'Technology',
  'University',
  'College',
  'Science',
  'Computer',
  'Information',
  'WhatsApp',
  'Group',
  'Final',
  'Step',
  'Alumni',
  'Achievement',
  'Microlise',
]);

const isLikelyPersonName = (value: string): boolean => {
  const name = value.trim();
  if (!name || name.length < 3 || NAME_BLOCKLIST.has(name)) {
    return false;
  }

  const parts = name.split(/\s+/);
  if (parts.length < 2 || parts.length > 4) {
    return false;
  }

  return parts.every((part) => /^[A-Z][a-z]+(?:\.?)$/.test(part));
};

const collectRegexMatches = (text: string, pattern: RegExp, groupIndex = 1): string[] => {
  const matches: string[] = [];
  const globalPattern = pattern.global
    ? pattern
    : new RegExp(pattern.source, `${pattern.flags}g`);

  for (const match of text.matchAll(globalPattern)) {
    const candidate = match[groupIndex]?.trim();
    if (candidate) {
      matches.push(candidate);
    }
  }

  return matches;
};

const NAME_END_LOOKAHEAD = `(?=\\s+(?:for|has|was|is|from|at|on|with|received|and)\\b|[,.]|$)`;
const PERSON_NAME_CAPTURE = `([A-Z][a-z]+(?:\\s+[A-Z][a-z]+){1,2})`;

const STUDENT_NAME_PATTERNS: RegExp[] = [
  new RegExp(
    `\\bto\\s+(?:Mr\\.?|Ms\\.?|Mrs\\.?|Shri\\.?|Smt\\.?|Dr\\.?)\\s+${PERSON_NAME_CAPTURE}${NAME_END_LOOKAHEAD}`,
    'gi',
  ),
  new RegExp(
    `\\b(?:issued|awarded|presented|granted|given|offered)\\s+to\\s+(?:Mr\\.?|Ms\\.?|Mrs\\.?|Shri\\.?|Smt\\.?|Dr\\.?)\\s+${PERSON_NAME_CAPTURE}${NAME_END_LOOKAHEAD}`,
    'gi',
  ),
  new RegExp(
    `\\b(?:Mr\\.?|Ms\\.?|Mrs\\.?|Shri\\.?|Smt\\.?)\\s+${PERSON_NAME_CAPTURE}${NAME_END_LOOKAHEAD}`,
    'gi',
  ),
  new RegExp(
    `\\b(?:certify|certifies)\\s+that\\s+(?:Mr\\.?|Ms\\.?|Mrs\\.?|Shri\\.?|Smt\\.?|Dr\\.?)\\s+${PERSON_NAME_CAPTURE}${NAME_END_LOOKAHEAD}`,
    'gi',
  ),
  new RegExp(
    `\\b(?:Name|Candidate|Student|Recipient|Beneficiary|Fellow)\\s*[:\\-]\\s*${PERSON_NAME_CAPTURE}${NAME_END_LOOKAHEAD}`,
    'gi',
  ),
  new RegExp(
    `\\bCongratulations\\s+(?:to\\s+)?(?:Mr\\.?|Ms\\.?|Mrs\\.?|Dr\\.?\\/Prof\\.?\\s+)?${PERSON_NAME_CAPTURE}${NAME_END_LOOKAHEAD}`,
    'gi',
  ),
  new RegExp(
    `\\b${PERSON_NAME_CAPTURE}\\s+(?:has been|was|is)\\s+(?:selected|awarded|placed|offered|granted)`,
    'gi',
  ),
  new RegExp(`\\b${PERSON_NAME_CAPTURE}\\s+(?:received|has received)\\b`, 'gi'),
  new RegExp(`\\b(?:alumni|student)\\s+${PERSON_NAME_CAPTURE}${NAME_END_LOOKAHEAD}`, 'gi'),
  new RegExp(`[:\\-]\\s*${PERSON_NAME_CAPTURE}\\s+(?:received|has been|was)\\b`, 'gi'),
];

export const extractStudentNamesFromText = (text: string): string[] => {
  if (!text.trim()) {
    return [];
  }

  const names = new Set<string>();

  for (const pattern of STUDENT_NAME_PATTERNS) {
    for (const candidate of collectRegexMatches(text, pattern)) {
      if (isLikelyPersonName(candidate)) {
        names.add(candidate);
      }
    }
  }

  return [...names];
};

export const extractStudentNamesFromObservations = (
  observations: Array<{ observation?: string | null }> | undefined,
): string[] => {
  if (!observations?.length) {
    return [];
  }

  const names = new Set<string>();
  for (const item of observations) {
    for (const name of extractStudentNamesFromText(item.observation ?? '')) {
      names.add(name);
    }
  }

  return [...names];
};

export const resolveStudentNamesFromExtractedData = (
  data: Record<string, unknown>,
): string[] => {
  const names = new Set<string>();

  const push = (value: unknown): void => {
    if (typeof value === 'string' && value.trim()) {
      if (isLikelyPersonName(value.trim())) {
        names.add(value.trim());
      }
      return;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && isLikelyPersonName(item.trim())) {
          names.add(item.trim());
        }
      }
    }
  };

  push(data.studentName);
  push(data.studentNames);

  const structured =
    typeof data.structuredData === 'object' && data.structuredData !== null
      ? (data.structuredData as Record<string, unknown>)
      : null;
  if (structured) {
    push(structured.studentName);
  }

  for (const name of extractStudentNamesFromObservations(
    Array.isArray(data.imageObservations)
      ? (data.imageObservations as Array<{ observation?: string }>)
      : undefined,
  )) {
    names.add(name);
  }

  for (const name of extractStudentNamesFromObservations(
    Array.isArray(data.pdfObservations)
      ? (data.pdfObservations as Array<{ observation?: string }>)
      : undefined,
  )) {
    names.add(name);
  }

  if (Array.isArray(data.evidence)) {
    for (const name of extractStudentNamesFromObservations(
      (data.evidence as Array<{ observation?: string }>).map((item) => ({
        observation: item.observation,
      })),
    )) {
      names.add(name);
    }
  }

  const textFields = [
    data.title,
    data.description,
    data.summary,
    data.aiGeneratedReport,
    ...(Array.isArray(data.achievements) ? data.achievements : []),
    ...(Array.isArray(data.keyHighlights) ? data.keyHighlights : []),
  ]
    .filter((value): value is string => typeof value === 'string')
    .join('\n');

  for (const name of extractStudentNamesFromText(textFields)) {
    names.add(name);
  }

  return [...names];
};

export const resolvePrimaryStudentName = (data: Record<string, unknown>): string | null =>
  resolveStudentNamesFromExtractedData(data)[0] ?? null;
