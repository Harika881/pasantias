// FILE: packages/providers/src/music/mock.ts
import { execFileSync } from "child_process";
import path from "path";
import { MusicProvider } from "../interfaces";
import { tmpDir } from "../utils/paths";

export class MockMusicProvider implements MusicProvider {
  name = "mock";
  async getTrack(mood: string, durationSec: number) {
    const localPath = path.join(tmpDir(), `music_${Date.now()}.mp3`);
    execFileSync("ffmpeg", [
      "-y", "-f", "lavfi", "-i", `sine=frequency=220:duration=${durationSec}`,
      "-af", "volume=0.05,aecho=0.6:0.5:40:0.25", localPath,
    ], { stdio: "ignore" });
    return { url: localPath, localPath };
  }
}