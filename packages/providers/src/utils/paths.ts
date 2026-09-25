// FILE: packages/providers/src/utils/paths.ts
import fs from "fs"; import os from "os"; import path from "path";
export function tmpDir() {
  const dir = path.join(os.tmpdir(), "ai-studio");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}