// FILE: packages/providers/src/image/mock.ts
import { execFileSync } from "child_process";
import path from "path";
import { ImageProvider } from "../interfaces";
import { tmpDir } from "../utils/paths";

export class MockImageProvider implements ImageProvider {
  name = "mock";
  async generateImage(prompt: string) {
    const localPath = path.join(tmpDir(), `img_${Date.now()}.png`);
    execFileSync("ffmpeg", [
      "-y", "-f", "lavfi", "-i", "color=c=0x1f2937:s=1536x1024",
      "-frames:v", "1", localPath,
    ], { stdio: "ignore" });
    return { url: localPath, localPath };
  }
}