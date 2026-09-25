// FILE: packages/providers/src/image/openai.ts
import OpenAI from "openai";
import axios from "axios";
import fs from "fs"; import path from "path";
import { ImageProvider } from "../interfaces";
import { withRetry } from "@studio/shared";
import { tmpDir } from "../utils/paths";

export class OpenAIImageProvider implements ImageProvider {
  name = "openai";
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  async generateImage(prompt: string, opts?: { width?: number; height?: number }) {
    const size = (opts?.width || 1024) >= (opts?.height || 1024) ? "1536x1024" : "1024x1536";
    const res = await withRetry(() => this.client.images.generate({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
      prompt, size: size as any, quality: "medium", n: 1,
    }), { retries: 0, timeoutMs: 60000 });
    const localPath = path.join(tmpDir(), `img_${Date.now()}.png`);
    const image = res.data?.[0];
    if (!image) throw new Error("OpenAI image response contained no image data");
    if (image.url) {
      const { data } = await axios.get(image.url, { responseType: "arraybuffer" });
      fs.writeFileSync(localPath, data);
      return { url: image.url, localPath };
    }
    if (image.b64_json) {
      fs.writeFileSync(localPath, Buffer.from(image.b64_json, "base64"));
      return { url: `file://${localPath}`, localPath };
    }
    throw new Error("OpenAI image response contained neither a URL nor image data");
  }
}