export const stripMarkdownJson = (text: string): string => {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fencedMatch ? fencedMatch[1].trim() : trimmed;
};

/** Best-effort repair for malformed Gemini JSON responses */
export const repairJsonText = (text: string): string => {
  let cleaned = stripMarkdownJson(text);

  const objectStart = cleaned.indexOf('{');
  const objectEnd = cleaned.lastIndexOf('}');
  if (objectStart >= 0 && objectEnd > objectStart) {
    cleaned = cleaned.slice(objectStart, objectEnd + 1);
  }

  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  cleaned = cleaned.replace(/\r\n/g, '\n');

  return cleaned.trim();
};

export const parseGeminiJson = <T>(text: string): T => {
  const attempts = [text, stripMarkdownJson(text), repairJsonText(text)];

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      continue;
    }
  }

  throw new SyntaxError('Unable to parse Gemini JSON response');
};
