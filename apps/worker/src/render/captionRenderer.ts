// FILE: apps/worker/src/render/captionRenderer.ts
import fs from "fs"; import path from "path"; import os from "os";

function tmpDir() {
  const dir = path.join(os.tmpdir(), "ai-studio");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function buildAssTrack(sceneId: string, words: { word: string; start: number; end: number }[], sceneOffset: number) {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Outline, Shadow, Alignment, MarginL, MarginR, MarginV
Style: Default,Arial,64,&H00FFFFFF,&H0038BDF8,&H00000000,&H80000000,1,3,1,2,80,80,120

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const lines: string[] = [];
  const groups = chunk(words || [], 6);
  for (const group of groups) {
    if (group.length === 0) continue;
    const start = group[0].start; const end = group[group.length - 1].end;
    const text = group.map((w) => escape(w.word)).join(" ");
    lines.push(`Dialogue: 0,${fmt(start)},${fmt(end)},Default,,0,0,0,,${text}`);
  }
  const assPath = path.join(tmpDir(), `captions_${sceneId}.ass`);
  fs.writeFileSync(assPath, header + lines.join("\n"));
  return assPath;
}

function chunk<T>(arr: T[], size: number) { const out: T[][] = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; }
function fmt(sec: number) { const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = (sec % 60).toFixed(2); return `${h}:${String(m).padStart(2, "0")}:${s.padStart(5, "0")}`; }
function escape(s: string) { return s.replace(/[{}]/g, ""); }