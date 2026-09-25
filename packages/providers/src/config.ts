// FILE: packages/providers/src/config.ts
export const env = (key: string, fallback = ""): string => process.env[key] ?? fallback;
export const hasKey = (key: string): boolean => !!process.env[key] && process.env[key]!.length > 0;