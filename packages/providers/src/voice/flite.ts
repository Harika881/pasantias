import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { VoiceProvider } from "../interfaces";
import { tmpDir } from "../utils/paths";
import { estimateWordTimestamps } from "../utils/timestamps";

export class FliteVoiceProvider implements VoiceProvider {
  name = "ffmpeg-flite";

  async synthesize(text: string) {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const dir = tmpDir();
    const textName = `flite_${id}.txt`;
    const textPath = path.join(dir, textName);
    const audioUrl = path.join(dir, `flite_${id}.wav`);
    fs.writeFileSync(textPath, text, "utf8");

    try {
      await new Promise<void>((resolve, reject) => {
        execFile("ffmpeg", [
          "-y", "-hide_banner", "-loglevel", "error",
          "-f", "lavfi", "-i", `flite=textfile=${textName}:voice=kal`,
          "-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", audioUrl,
        ], { cwd: dir }, (error, _stdout, stderr) => {
          if (error) reject(new Error(stderr.trim() || error.message));
          else resolve();
        });
      });
    } finally {
      fs.rmSync(textPath, { force: true });
    }

    const words = estimateWordTimestamps(text, text.trim().split(/\s+/).length / 2.7);
    return { audioUrl, durationSec: words.at(-1)?.end || 1, words };
  }
}