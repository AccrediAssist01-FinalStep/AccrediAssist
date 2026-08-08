/** Standard 5-column proportions from STUDENT ACHIEVEMENT REPORT.docx */
export const STANDARD_TEMPLATE_COLUMN_WEIGHTS = [1294, 900, 3824, 2382, 960] as const;

export const getTemplateColumnWidths = (
  columnWeights: readonly number[],
  totalWidth: number,
): number[] => {
  const totalWeight = columnWeights.reduce((sum, weight) => sum + weight, 0);
  const widths = columnWeights.map((weight) => Math.floor((weight / totalWeight) * totalWidth));
  const used = widths.reduce((sum, width) => sum + width, 0);
  widths[widths.length - 1] += totalWidth - used;
  return widths;
};

export const STANDARD_TEMPLATE_COLUMN_WIDTHS_DXA = [...STANDARD_TEMPLATE_COLUMN_WEIGHTS];
