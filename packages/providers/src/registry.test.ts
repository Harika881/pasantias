// FILE: packages/providers/src/registry.test.ts
import { describe, it, expect } from "vitest";
import { ProviderRegistry } from "./registry";

describe("ProviderRegistry", () => {
  it("does not include mock media providers unless explicitly enabled", () => {
    const names = ["OPENAI_API_KEY", "ELEVENLABS_API_KEY", "DID_API_KEY", "HEYGEN_API_KEY", "RUNWAY_API_KEY", "ALLOW_MOCK_PROVIDERS"];
    const original = Object.fromEntries(names.map((name) => [name, process.env[name]]));
    try {
      for (const name of names) delete process.env[name];
      const registry = new ProviderRegistry();
      expect(registry.imageFallbackChain().map((provider) => provider.name)).toContain("local-motion-graphics");
      expect(registry.videoFallbackChain()).toHaveLength(0);
      expect(registry.voiceFallbackChain().map((provider) => provider.name)).toEqual(["ffmpeg-flite"]);
      expect(registry.avatarFallbackChain()).toHaveLength(0);
    } finally {
      for (const name of names) {
        if (original[name] === undefined) delete process.env[name];
        else process.env[name] = original[name];
      }
    }
  });

  it("allows mock media providers only when explicitly enabled", () => {
    const original = process.env.ALLOW_MOCK_PROVIDERS;
    try {
      process.env.ALLOW_MOCK_PROVIDERS = "true";
      const registry = new ProviderRegistry();
      expect(registry.voiceFallbackChain().at(-1)?.name).toBe("mock");
      expect(registry.avatarFallbackChain().at(-1)?.name).toBe("mock");
    } finally {
      if (original === undefined) delete process.env.ALLOW_MOCK_PROVIDERS;
      else process.env.ALLOW_MOCK_PROVIDERS = original;
    }
  });

  it("selects ElevenLabs in the voice fallback chain when configured", () => {
    const originalApiKey = process.env.ELEVENLABS_API_KEY;
    const originalOpenAIKey = process.env.OPENAI_API_KEY;
    const originalProvider = process.env.VOICE_PROVIDER;
    try {
      process.env.ELEVENLABS_API_KEY = "test-key";
      delete process.env.OPENAI_API_KEY;
      process.env.VOICE_PROVIDER = "elevenlabs";
      expect(new ProviderRegistry().voiceFallbackChain()[0].name).toBe("elevenlabs");
    } finally {
      if (originalApiKey === undefined) delete process.env.ELEVENLABS_API_KEY;
      else process.env.ELEVENLABS_API_KEY = originalApiKey;
      if (originalOpenAIKey === undefined) delete process.env.OPENAI_API_KEY;
      else process.env.OPENAI_API_KEY = originalOpenAIKey;
      if (originalProvider === undefined) delete process.env.VOICE_PROVIDER;
      else process.env.VOICE_PROVIDER = originalProvider;
    }
  });
});