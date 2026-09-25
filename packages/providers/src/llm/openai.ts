// FILE: packages/providers/src/llm/openai.ts
import OpenAI from "openai";
import { withRetry } from "@studio/shared";
import { JsonLLMBase } from "./jsonLlmBase";

const MODEL = process.env.OPENAI_LLM_MODEL || "gpt-4o-mini";

export class OpenAILLMProvider extends JsonLLMBase {
  name = "openai";
  protected supportsNativeJsonMode = true;
  private client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  protected async complete(system: string, user: string): Promise<string> {
    return withRetry(async () => {
      const res = await this.client.chat.completions.create({
        model: MODEL,
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
      return res.choices[0].message.content || "{}";
    }, { retries: 3, timeoutMs: 60000 });
  }
}