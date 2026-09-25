import axios from "axios";
import fs from "fs";
import path from "path";
import { VoiceProvider } from "../interfaces";
import { tmpDir } from "../utils/paths";
import { estimateWordTimestamps } from "../utils/timestamps";

export class ElevenLabsVoiceProvider implements VoiceProvider {
  name = "elevenlabs";

  async synthesize(text: string, opts?: { voiceId?: string; speed?: number; language?: string }) {
    const voiceId = opts?.voiceId || process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
    const response = await axios.post<ArrayBuffer>(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75, speed: opts?.speed || 1 },
        ...(opts?.language ? { language_code: opts.language } : {}),
      },
      {
        headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json" },
        responseType: "arraybuffer",
        timeout: 60000,
      },
    );

    const filePath = path.join(tmpDir(), `voice_${Date.now()}.mp3`);
    fs.writeFileSync(filePath, Buffer.from(response.data));
    const words = estimateWordTimestamps(text, text.split(/\s+/).length / 2.5);
    return { audioUrl: filePath, durationSec: words.at(-1)?.end || 0, words };
  }
}