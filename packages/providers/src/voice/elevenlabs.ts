// FILE: packages/providers/src/video/mock.ts
import { execSync } from "child_process";
import path from "path";
import { VideoProvider } from "../interfaces";
import { tmpDir } from "../utils/paths";

export class MockVideoProvider implements VideoProvider {
  name = "mock";
  async generateClip(prompt: string, durationSec: number) {
    const localPath = path.join(tmpDir(), `clip_${Date.now()}.mp4`);
    const label = prompt.replace(/["':]/g, "").slice(0, 40);
    execSync(
      `ffmpeg -y -f lavfi -i color=c=0x111827:s=1920x1080:d=${durationSec} ` +
      `-vf "drawtext=text='${label}':fontcolor=white:fontsize=42:x=(w-text_w)/2:y=(h-text_h)/2,zoompan=z='min(zoom+0.0008,1.15)':d=${Math.round(durationSec * 25)}:s=1920x1080" ` +
      `-c:v libx264 -pix_fmt yuv420p -t ${durationSec} "${localPath}"`,
      { stdio: "ignore" }
    );
    return { url: localPath, localPath };
  }
}