// FILE: packages/providers/src/llm/groq.ts
import OpenAI from "openai";
import { withRetry } from "@studio/shared";
import { JsonLLMBase } from "./jsonLlmBase";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export class GroqLLMProvider extends JsonLLMBase {
  name = "groq";
  protected supportsNativeJsonMode = true;
  private client = new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: "https://api.groq.com/openai/v1" });

  protected async complete(system: string, user: string): Promise<string> {
    return withRetry(async () => {
      const res = await this.client.chat.completions.create({
        model: MODEL,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
      return res.choices[0].message.content || "{}";
    }, { retries: 3, timeoutMs: 45000 });
  }
}