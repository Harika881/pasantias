// FILE: packages/providers/src/utils/jsonRepair.ts
import { logger } from "@studio/shared";

export function extractJsonCandidate(raw: string): string {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) text = fenceMatch[1].trim();
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }
  return text;
}

export function tryParseJson<T>(raw: string): T | null {
  try { return JSON.parse(extractJsonCandidate(raw)) as T; }
  catch { return null; }
}

export async function completeJsonWithRepair<T>(
  complete: (system: string, user: string) => Promise<string>,
  system: string,
  user: string,
  maxAttempts = 3
): Promise<T> {
  let lastRaw = "";
  let lastError = "";
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const prompt = attempt === 0
      ? user
      : `${user}\n\nYOUR PREVIOUS RESPONSE WAS INVALID JSON. Error: ${lastError}\nPREVIOUS RESPONSE:\n${lastRaw}\n\nReturn ONLY corrected, valid JSON. No markdown fences, no explanation.`;
    const raw = await complete(system, prompt);
    lastRaw = raw;
    const parsed = tryParseJson<T>(raw);
    if (parsed) return parsed;
    lastError = "JSON.parse failed — likely markdown fences, trailing commas, or unescaped quotes.";
    logger.warn({ attempt }, "LLM returned invalid JSON, retrying with self-repair prompt");
  }
  throw new Error(`Model failed to produce valid JSON after ${maxAttempts} attempts`);
}