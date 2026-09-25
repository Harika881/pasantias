// FILE: packages/providers/src/llm/ollama.ts
import axios from "axios";
import { withRetry } from "@studio/shared";
import { JsonLLMBase } from "./jsonLlmBase";

const MODEL = process.env.OLLAMA_MODEL || "llama3.2:latest";
const HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

export class OllamaLLMProvider extends JsonLLMBase {
  name = "ollama";

  protected async complete(system: string, user: string): Promise<string> {
    return withRetry(async () => {
      const res = await axios.post(`${HOST}/api/chat`, {
        model: MODEL,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        format: "json", stream: false, options: { temperature: 0.7 },
      }, { timeout: 120000 });
      return res.data.message.content;
    }, { retries: 2, timeoutMs: 125000 });
  }
}