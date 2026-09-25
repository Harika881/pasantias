// FILE: packages/shared/src/utils/retry.test.ts
import { describe, it, expect } from "vitest";
import { withRetry, withFallback } from "./retry";

describe("withRetry", () => {
  it("retries then succeeds", async () => {
    let calls = 0;
    const result = await withRetry(async () => { calls++; if (calls < 3) throw new Error("fail"); return "ok"; }, { retries: 3, baseDelayMs: 1 });
    expect(result).toBe("ok"); expect(calls).toBe(3);
  });
});

describe("withFallback", () => {
  it("falls back to second provider", async () => {
    const { result, providerUsed } = await withFallback([
      { name: "a", run: async () => { throw new Error("down"); } },
      { name: "b", run: async () => "value" },
    ], { retries: 0 });
    expect(result).toBe("value"); expect(providerUsed).toBe("b");
  });

  it("reports when no providers are configured", async () => {
    await expect(withFallback([])).rejects.toThrow("No providers are configured");
  });

  it("includes the final provider error when all providers fail", async () => {
    await expect(withFallback([
      { name: "openai-tts", run: async () => { throw new Error("Unauthorized"); } },
    ], { retries: 0 })).rejects.toThrow("All providers failed (openai-tts): Unauthorized");
  });
});