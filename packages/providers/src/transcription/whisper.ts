// FILE: packages/providers/src/transcription/whisper.ts
import OpenAI from "openai";
import fs from "fs";
import { TranscriptionProvider } from "../interfaces";
import { withRetry } from "@studio/shared";

export class WhisperTranscriptionProvider implements TranscriptionProvider {
  name = "whisper";
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  async transcribe(audioPath: string) {
    const res = await withRetry(() => this.client.audio.transcriptions.create({
      file: fs.createReadStream(audioPath), model: "whisper-1",
      response_format: "verbose_json", timestamp_granularities: ["word"],
    } as any), { retries: 2, timeoutMs: 60000 });
    const words = ((res as any).words || []).map((w: any) => ({ word: w.word, start: w.start, end: w.end }));
    return { words };
  }
}