// FILE: packages/providers/src/registry.test.ts
import { describe, it, expect } from "vitest";
import { ProviderRegistry } from "./registry";

describe("ProviderRegistry", () => {
  it("falls back to mock providers when no API keys are set", () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const reg = new ProviderRegistry();
    expect(reg.voice().name).toBe("mock");
    expect(reg.avatar().name).toBe("mock");
  });
});