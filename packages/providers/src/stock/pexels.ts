// FILE: packages/providers/src/stock/pexels.ts
import axios from "axios";
import { StockMediaProvider } from "../interfaces";
import { withRetry } from "@studio/shared";

export class PexelsStockProvider implements StockMediaProvider {
  name = "pexels";
  private headers = { Authorization: process.env.PEXELS_API_KEY! };

  async searchVideo(query: string) {
    const { data } = await withRetry(() => axios.get("https://api.pexels.com/videos/search", {
      headers: this.headers, params: { query, per_page: 1, orientation: "landscape" }, timeout: 15000,
    }), { retries: 2 });
    const v = data.videos?.[0];
    if (!v) return null;
    const file = v.video_files.sort((a: any, b: any) => b.width - a.width)[0];
    return { url: file.link, license: "Pexels License (free to use)" };
  }

  async searchImage(query: string) {
    const { data } = await withRetry(() => axios.get("https://api.pexels.com/v1/search", {
      headers: this.headers, params: { query, per_page: 1 }, timeout: 15000,
    }), { retries: 2 });
    const p = data.photos?.[0];
    if (!p) return null;
    return { url: p.src.large2x, license: "Pexels License (free to use)" };
  }
}