// FILE: apps/worker/src/render/thumbnail.ts
import sharp from "sharp";
import path from "path"; import os from "os"; import fs from "fs";

function tmpDir() {
  const dir = path.join(os.tmpdir(), "ai-studio");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function renderThumbnail(bgPath: string, titleText: string) {
  const outPath = path.join(tmpDir(), `thumb_${Date.now()}.png`);
  const svg = `
    <svg width="1280" height="720">
      <defs>
        <linearGradient id="g" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stop-color="black" stop-opacity="0.85"/>
          <stop offset="45%" stop-color="black" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#g)"/>
      <text x="60" y="620" font-family="Arial" font-weight="900" font-size="76" fill="white"
        stroke="black" stroke-width="4">${escapeXml(titleText.slice(0, 40))}</text>
    </svg>`;
  await sharp(bgPath).resize(1280, 720).composite([{ input: Buffer.from(svg) }]).png().toFile(outPath);
  return outPath;
}
function escapeXml(s: string) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }