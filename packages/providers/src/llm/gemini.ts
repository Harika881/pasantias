// FILE: packages/providers/src/llm/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { withRetry, logger } from "@studio/shared";
import { JsonLLMBase } from "./jsonLlmBase";

const PRIMARY_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
// Fallback chain tried in order if the primary model is unavailable or overloaded.
const FALLBACK_MODELS = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

export class GeminiLLMProvider extends JsonLLMBase {
  name = "gemini";
  protected supportsNativeJsonMode = true;
  private client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  protected async complete(system: string, user: string): Promise<string> {
    const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS.filter((m) => m !== PRIMARY_MODEL)];
    let lastErr: unknown;

    for (const modelName of modelsToTry) {
      try {
        return await withRetry(async () => {
          const model = this.client.getGenerativeModel({
            model: modelName,
            systemInstruction: system,
            generationConfig: { responseMimeType: "application/json", temperature: 0.7 },
          });
          const res = await model.generateContent(user);
          return res.response.text();
        }, { retries: 1, timeoutMs: 45000 });
      } catch (err: any) {
        const message = String(err?.message || "").toLowerCase();
        const isUnavailable = message.includes("404") || message.includes("not found") || message.includes("no longer available");
        const isOverloaded = message.includes("503") || message.includes("service unavailable") || message.includes("high demand");
        if (isUnavailable || isOverloaded) {
          logger.warn({ modelName }, "Gemini model unavailable or overloaded, trying next fallback model");
          lastErr = err;
          continue; // try next model name
        }
        throw err; // auth, quota, and other non-transient errors should propagate immediately
      }
    }
    throw lastErr;
  }
}