// FILE: packages/providers/src/avatar/mock.ts
import { execFileSync } from "child_process";
import path from "path";
import { AvatarProvider } from "../interfaces";
import { tmpDir } from "../utils/paths";

export class MockAvatarProvider implements AvatarProvider {
  name = "mock";
  async generateTalkingVideo(params: { audioUrl: string }) {
    const localPath = path.join(tmpDir(), `avatar_${Date.now()}.mp4`);
    execFileSync("ffmpeg", [
      "-y", "-f", "lavfi", "-i", "color=c=0x0f172a:s=1080x1080:d=3",
      "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono",
      "-t", "3", "-c:v", "libx264", "-c:a", "aac", "-shortest",
      "-pix_fmt", "yuv420p", localPath,
    ], { stdio: "ignore" });
    return { videoUrl: localPath, localPath, alreadyLipSynced: true };
  }
}