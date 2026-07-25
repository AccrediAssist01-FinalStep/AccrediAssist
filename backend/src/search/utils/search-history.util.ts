export const buildStructuredSearchHistoryQuery = (
  collection: string,
  filters: Record<string, unknown> = {},
): string => {
  if (Object.keys(filters).length === 0) {
    return collection;
  }

  return `${collection}: ${JSON.stringify(filters)}`;
};
