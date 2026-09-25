// FILE: packages/providers/src/utils/timestamps.ts
export function estimateWordTimestamps(text: string, totalDurationSec: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const per = totalDurationSec / Math.max(1, words.length);
  return words.map((w, i) => ({ word: w, start: +(i * per).toFixed(2), end: +((i + 1) * per).toFixed(2) }));
}