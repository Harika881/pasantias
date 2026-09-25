// FILE: packages/providers/src/avatar/heygen.ts
import axios from "axios"; import fs from "fs"; import path from "path";
import { AvatarProvider } from "../interfaces";
import { withRetry } from "@studio/shared";
import { tmpDir } from "../utils/paths";

export class HeyGenAvatarProvider implements AvatarProvider {
  name = "heygen";
  private base = "https://api.heygen.com/v2";
  private headers = { "X-Api-Key": process.env.HEYGEN_API_KEY!, "Content-Type": "application/json" };

  async generateTalkingVideo(params: { audioUrl: string; avatarConfig: Record<string, unknown> }) {
    const avatarId = (params.avatarConfig.avatarId as string) || "default";
    const create = await withRetry(() => axios.post(`${this.base}/video/generate`, {
      video_inputs: [{
        character: { type: "avatar", avatar_id: avatarId, avatar_style: "normal" },
        voice: { type: "audio", audio_url: params.audioUrl },
      }],
      dimension: { width: 1920, height: 1080 },
    }, { headers: this.headers, timeout: 30000 }));
    const videoId = create.data.data.video_id;

    let status = "pending"; let videoUrl = "";
    for (let i = 0; i < 60 && status !== "completed"; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const poll = await axios.get(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, { headers: this.headers });
      status = poll.data.data.status;
      if (status === "completed") videoUrl = poll.data.data.video_url;
      if (status === "failed") throw new Error("HeyGen generation failed");
    }
    if (!videoUrl) throw new Error("HeyGen generation timed out");
    const { data } = await axios.get(videoUrl, { responseType: "arraybuffer" });
    const localPath = path.join(tmpDir(), `avatar_${Date.now()}.mp4`);
    fs.writeFileSync(localPath, data);
    return { videoUrl, localPath, alreadyLipSynced: true };
  }
}