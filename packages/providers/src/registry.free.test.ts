// FILE: packages/providers/src/registry.free.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { ProviderRegistry } from "./registry";

describe("ProviderRegistry free-tier selection", () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.LLM_PROVIDER;
  });

  it("selects Groq when GROQ_API_KEY is set", () => {
    process.env.LLM_PROVIDER = "auto";
    process.env.GROQ_API_KEY = "test-key";
    expect(new ProviderRegistry().llm().name).toBe("groq");
  });

  it("selects Gemini when only GEMINI_API_KEY is set", () => {
    process.env.LLM_PROVIDER = "auto";
    process.env.GEMINI_API_KEY = "test-key";
    expect(new ProviderRegistry().llm().name).toBe("gemini");
  });

  it("falls back to Ollama with zero keys", () => {
    expect(new ProviderRegistry().llm().name).toBe("ollama");
  });
});