// FILE: packages/providers/src/video/mock.ts
import { execFileSync } from "child_process";
import path from "path";
import { VideoProvider } from "../interfaces";
import { tmpDir } from "../utils/paths";

export class MockVideoProvider implements VideoProvider {
  name = "mock";
  async generateClip(prompt: string, durationSec: number) {
    const localPath = path.join(tmpDir(), `clip_${Date.now()}.mp4`);
    execFileSync("ffmpeg", [
      "-y", "-f", "lavfi", "-i", `color=c=0x111827:s=1920x1080:d=${durationSec}`,
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-t", String(durationSec), localPath,
    ], { stdio: "ignore" });
    return { url: localPath, localPath };
  }
}