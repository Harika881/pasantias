import fs from "fs";
import path from "path";
import sharp from "sharp";
import { ImageProvider } from "../interfaces";
import { tmpDir } from "../utils/paths";

const PALETTES = [
  ["#123a3a", "#276d65", "#e1a65a", "#f2d9a7"],
  ["#392b32", "#9d5147", "#e0a06c", "#f3d9bd"],
  ["#1d3346", "#376a78", "#d59b53", "#e6d9bd"],
  ["#34422e", "#718255", "#d49a54", "#f0dcaf"],
  ["#382b43", "#75506e", "#d09063", "#f1d2b6"],
];

export class LocalMotionGraphicProvider implements ImageProvider {
  name = "local-motion-graphics";

  async generateImage(prompt: string) {
    const hash = [...prompt].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
    const [base, secondary, accent, paper] = PALETTES[hash % PALETTES.length];
    const title = wrap(prompt.replace(/\b(style illustration|visual concept):/gi, "").trim(), 31, 3);
    const titleSvg = title.map((line, index) =>
      `<text x="142" y="${660 + index * 82}" fill="${paper}" font-family="Georgia,serif" font-size="66">${escapeXml(line)}</text>`
    ).join("");
    const offset = hash % 280;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${base}"/><stop offset=".62" stop-color="${secondary}"/><stop offset="1" stop-color="${base}"/></linearGradient>
        <radialGradient id="sun"><stop stop-color="${accent}" stop-opacity=".95"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
        <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse"><path d="M72 0H0V72" fill="none" stroke="${paper}" stroke-opacity=".11" stroke-width="1"/></pattern>
        <linearGradient id="shade" x1="0" x2="1"><stop stop-color="#10191d" stop-opacity=".84"/><stop offset=".7" stop-color="#10191d" stop-opacity=".22"/><stop offset="1" stop-color="#10191d" stop-opacity="0"/></linearGradient>
      </defs>
      <rect width="1920" height="1080" fill="url(#bg)"/>
      <rect width="1920" height="1080" fill="url(#grid)"/>
      <circle cx="${1420 + offset}" cy="${340 + offset / 3}" r="510" fill="url(#sun)"/>
      <circle cx="${1470 + offset}" cy="350" r="280" fill="none" stroke="${paper}" stroke-opacity=".48" stroke-width="2"/>
      <circle cx="${1470 + offset}" cy="350" r="360" fill="none" stroke="${paper}" stroke-opacity=".27" stroke-width="2" stroke-dasharray="4 18"/>
      <path d="M${1020 + offset} 880 C${1190 + offset} 680 ${1320 + offset} 1070 ${1580 + offset} 760 S1800 560 1940 730" fill="none" stroke="${paper}" stroke-opacity=".72" stroke-width="3"/>
      <path d="M0 900 C280 770 480 1020 760 860 S1050 760 1240 900 V1080 H0Z" fill="${base}" fill-opacity=".38"/>
      <rect x="0" y="0" width="1190" height="1080" fill="url(#shade)"/>
      <path d="M142 570h102" stroke="${accent}" stroke-width="8"/>
      ${titleSvg}
      <text x="142" y="860" fill="${paper}" fill-opacity=".78" font-family="Arial,sans-serif" font-size="23">${escapeXml(prompt.slice(0, 72))}</text>
    </svg>`;
    const localPath = path.join(tmpDir(), `local_visual_${Date.now()}_${hash}.png`);
    await sharp(Buffer.from(svg)).png().toFile(localPath);
    return { url: localPath, localPath };
  }
}

function wrap(text: string, maxLength: number, maxLines: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxLength && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = next;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines.length ? lines : ["A story worth seeing"];
}

function escapeXml(text: string) {
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]!);
}