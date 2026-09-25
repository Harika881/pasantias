// FILE: packages/providers/src/lipsync/syncso.ts
import axios from "axios"; import fs from "fs"; import path from "path";
import { LipSyncProvider } from "../interfaces";
import { withRetry } from "@studio/shared";
import { tmpDir } from "../utils/paths";

export class SyncSoLipSyncProvider implements LipSyncProvider {
  name = "syncso";
  private base = "https://api.sync.so/v2";
  private headers = { "x-api-key": process.env.SYNC_API_KEY!, "Content-Type": "application/json" };

  async sync(params: { videoUrl: string; audioUrl: string }) {
    const create = await withRetry(() => axios.post(`${this.base}/generate`, {
      model: "lipsync-1.9.0-beta",
      input: [{ type: "video", url: params.videoUrl }, { type: "audio", url: params.audioUrl }],
    }, { headers: this.headers, timeout: 30000 }));
    const id = create.data.id;

    let status = "PENDING"; let outputUrl = "";
    for (let i = 0; i < 60 && status !== "COMPLETED"; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const poll = await axios.get(`${this.base}/generate/${id}`, { headers: this.headers });
      status = poll.data.status;
      if (status === "COMPLETED") outputUrl = poll.data.outputUrl;
      if (status === "FAILED") throw new Error("Sync.so lipsync failed");
    }
    if (!outputUrl) throw new Error("Sync.so timed out");
    const { data } = await axios.get(outputUrl, { responseType: "arraybuffer" });
    const localPath = path.join(tmpDir(), `lipsync_${Date.now()}.mp4`);
    fs.writeFileSync(localPath, data);
    return { videoUrl: outputUrl, localPath };
  }
}