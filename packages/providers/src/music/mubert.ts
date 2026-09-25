// FILE: packages/providers/src/music/mubert.ts
import axios from "axios"; import fs from "fs"; import path from "path";
import { MusicProvider } from "../interfaces";
import { withRetry } from "@studio/shared";
import { tmpDir } from "../utils/paths";

export class MubertMusicProvider implements MusicProvider {
  name = "mubert";
  async getTrack(mood: string, durationSec: number) {
    const res = await withRetry(() => axios.post("https://music-api.mubert.com/api/v3/public/tracks", {
      method: "RecordTrack",
      params: { license: process.env.MUBERT_LICENSE, duration: durationSec, mood, bitrate: 320 },
    }, { headers: { Authorization: `Bearer ${process.env.MUBERT_API_KEY}` }, timeout: 30000 }));
    const url = res.data?.data?.tasks?.[0]?.download_link;
    if (!url) throw new Error("Mubert returned no track");
    const { data } = await axios.get(url, { responseType: "arraybuffer" });
    const localPath = path.join(tmpDir(), `music_${Date.now()}.mp3`);
    fs.writeFileSync(localPath, data);
    return { url, localPath };
  }
}