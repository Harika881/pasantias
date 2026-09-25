// FILE: packages/providers/src/voice/mock.ts
import path from "path";
import { execFileSync } from "child_process";
import { VoiceProvider } from "../interfaces";
import { tmpDir } from "../utils/paths";
import { estimateWordTimestamps } from "../utils/timestamps";

export class MockVoiceProvider implements VoiceProvider {
  name = "mock";
  async synthesize(text: string) {
    const words = estimateWordTimestamps(text, text.split(" ").length / 2.5);
    const duration = Math.max(1, words[words.length - 1]?.end || 3);
    const filePath = path.join(tmpDir(), `voice_${Date.now()}.wav`);
    execFileSync("ffmpeg", [
      "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", String(duration), filePath,
    ], { stdio: "ignore" });
    return { audioUrl: filePath, durationSec: duration, words };
  }
}