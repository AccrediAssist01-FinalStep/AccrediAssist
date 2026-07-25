export const ACTIVE_MATCH = { isDeleted: { $ne: true } } as const;

export const countPipeline = [
  { $match: ACTIVE_MATCH },
  { $count: 'total' },
] as const;

export const buildMonthDateRange = (year: number, month: number): { start: Date; end: Date } => {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  return { start, end };
};

export const buildYearDateRange = (year: number): { start: Date; end: Date } => ({
  start: new Date(Date.UTC(year, 0, 1)),
  end: new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)),
});

export const extractCount = (result: Array<{ total?: number }>): number => result[0]?.total ?? 0;

export const studentNameProjectionPipeline = [
  { $match: { ...ACTIVE_MATCH, studentName: { $exists: true, $nin: [null, ''] } } },
  {
    $project: {
      studentName: {
        $toLower: {
          $trim: { input: '$studentName' },
        },
      },
    },
  },
] as const;
