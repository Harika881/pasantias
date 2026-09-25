// FILE: packages/providers/src/voice/openaiTTS.ts
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { VoiceProvider } from "../interfaces";
import { withRetry } from "@studio/shared";
import { tmpDir } from "../utils/paths";
import { estimateWordTimestamps } from "../utils/timestamps";

export class OpenAITTSProvider implements VoiceProvider {
  name = "openai-tts";
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async synthesize(text: string, opts?: { voiceId?: string; speed?: number }) {
    const res = await withRetry(() => this.client.audio.speech.create({
      model: "tts-1-hd", voice: (opts?.voiceId as any) || "alloy", input: text, speed: opts?.speed || 1.0,
    }), { retries: 0, timeoutMs: 60000 });
    const buf = Buffer.from(await res.arrayBuffer());
    const filePath = path.join(tmpDir(), `voice_${Date.now()}.mp3`);
    fs.writeFileSync(filePath, buf);
    const words = estimateWordTimestamps(text, text.split(" ").length / 2.5);
    return { audioUrl: filePath, durationSec: words[words.length - 1]?.end || 0, words };
  }
}