// FILE: packages/providers/src/video/runway.ts
import axios from "axios"; import fs from "fs"; import path from "path";
import { VideoProvider } from "../interfaces";
import { withRetry } from "@studio/shared";
import { tmpDir } from "../utils/paths";

export class RunwayVideoProvider implements VideoProvider {
  name = "runway";
  private base = "https://api.runwayml.com/v1";
  private headers = { Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`, "Content-Type": "application/json" };

  async generateClip(prompt: string, durationSec: number) {
    const create = await withRetry(() => axios.post(`${this.base}/text_to_video`, {
      promptText: prompt, duration: Math.min(10, Math.max(2, Math.round(durationSec))), ratio: "16:9",
    }, { headers: this.headers, timeout: 30000 }));
    const taskId = create.data.id;

    let status = "PENDING"; let outputUrl = "";
    for (let i = 0; i < 30 && status !== "SUCCEEDED"; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const poll = await axios.get(`${this.base}/tasks/${taskId}`, { headers: this.headers });
      status = poll.data.status;
      if (status === "SUCCEEDED") outputUrl = poll.data.output[0];
      if (status === "FAILED") throw new Error("Runway generation failed");
    }
    if (!outputUrl) throw new Error("Runway generation timed out");
    const { data } = await axios.get(outputUrl, { responseType: "arraybuffer" });
    const localPath = path.join(tmpDir(), `runway_${Date.now()}.mp4`);
    fs.writeFileSync(localPath, data);
    return { url: outputUrl, localPath };
  }
}