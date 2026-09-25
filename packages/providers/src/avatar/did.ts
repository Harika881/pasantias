// FILE: packages/providers/src/avatar/did.ts
import axios from "axios"; import fs from "fs"; import path from "path";
import { AvatarProvider } from "../interfaces";
import { withRetry } from "@studio/shared";
import { tmpDir } from "../utils/paths";

export class DIDAvatarProvider implements AvatarProvider {
  name = "did";
  private base = "https://api.d-id.com";
  private auth = { Authorization: `Basic ${Buffer.from(process.env.DID_API_KEY + ":").toString("base64")}` };

  async generateTalkingVideo(params: { audioUrl: string; avatarConfig: Record<string, unknown> }) {
    const sourceUrl = (params.avatarConfig.imageUrl as string) ||
      "https://create-images-results.d-id.com/DefaultPresenters/Emma_f/image.jpeg";

    const create = await withRetry(() => axios.post(`${this.base}/talks`, {
      source_url: sourceUrl,
      script: { type: "audio", audio_url: params.audioUrl },
      config: { fluent: true, stitch: true },
    }, { headers: this.auth, timeout: 30000 }));
    const id = create.data.id;

    let status = "created"; let resultUrl = "";
    for (let i = 0; i < 40 && status !== "done"; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      const poll = await axios.get(`${this.base}/talks/${id}`, { headers: this.auth });
      status = poll.data.status;
      if (status === "done") resultUrl = poll.data.result_url;
      if (status === "error") throw new Error("D-ID generation error: " + JSON.stringify(poll.data.error));
    }
    if (!resultUrl) throw new Error("D-ID generation timed out");
    const { data } = await axios.get(resultUrl, { responseType: "arraybuffer" });
    const localPath = path.join(tmpDir(), `avatar_${Date.now()}.mp4`);
    fs.writeFileSync(localPath, data);
    return { videoUrl: resultUrl, localPath, alreadyLipSynced: true };
  }
}