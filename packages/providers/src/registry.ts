// FILE: packages/providers/src/registry.ts
import { hasKey } from "./config";
import * as I from "./interfaces";

import { GroqLLMProvider } from "./llm/groq";
import { GeminiLLMProvider } from "./llm/gemini";
import { OllamaLLMProvider } from "./llm/ollama";
import { OpenAILLMProvider } from "./llm/openai";
import { MockLLMProvider } from "./llm/mock";

import { TavilyResearchProvider } from "./research/tavily";
import { MockResearchProvider } from "./research/mock";
import { OpenAIImageProvider } from "./image/openai";
import { MockImageProvider } from "./image/mock";
import { PexelsStockProvider } from "./stock/pexels";
import { MockStockProvider } from "./stock/mock";
import { RunwayVideoProvider } from "./video/runway";
import { MockVideoProvider } from "./video/mock";
import { ElevenLabsVoiceProvider } from "./voice/elevenlabs";
import { OpenAITTSProvider } from "./voice/openaiTTS";
import { MockVoiceProvider } from "./voice/mock";
import { DIDAvatarProvider } from "./avatar/did";
import { HeyGenAvatarProvider } from "./avatar/heygen";
import { MockAvatarProvider } from "./avatar/mock";
import { SyncSoLipSyncProvider } from "./lipsync/syncso";
import { MockLipSyncProvider } from "./lipsync/mock";
import { MubertMusicProvider } from "./music/mubert";
import { MockMusicProvider } from "./music/mock";
import { LocalSfxProvider } from "./sfx/local";
import { WhisperTranscriptionProvider } from "./transcription/whisper";
import { MockTranscriptionProvider } from "./transcription/mock";
import { logger } from "@studio/shared";

export class ProviderRegistry {
  llm(): I.LLMProvider {
    const pref = (process.env.LLM_PROVIDER || "auto").toLowerCase();
    if ((pref === "groq" || pref === "auto") && hasKey("GROQ_API_KEY")) return new GroqLLMProvider();
    if ((pref === "gemini" || pref === "auto") && hasKey("GEMINI_API_KEY")) return new GeminiLLMProvider();
    if (pref === "openai" && hasKey("OPENAI_API_KEY")) return new OpenAILLMProvider();
    if (pref === "ollama" || (pref === "auto" && !hasKey("GROQ_API_KEY") && !hasKey("GEMINI_API_KEY") && !hasKey("OPENAI_API_KEY"))) {
      return new OllamaLLMProvider();
    }
    logger.warn("No LLM provider configured/reachable — using MockLLMProvider.");
    return new MockLLMProvider();
  }

  llmFallbackChain(): I.LLMProvider[] {
    const chain: I.LLMProvider[] = [];
    if (hasKey("GROQ_API_KEY")) chain.push(new GroqLLMProvider());
    if (hasKey("GEMINI_API_KEY")) chain.push(new GeminiLLMProvider());
    chain.push(new OllamaLLMProvider());
    if (hasKey("OPENAI_API_KEY")) chain.push(new OpenAILLMProvider());
    chain.push(new MockLLMProvider());
    return chain;
  }

  research(): I.ResearchProvider {
    if ((process.env.RESEARCH_PROVIDER || "tavily") === "tavily" && hasKey("TAVILY_API_KEY")) return new TavilyResearchProvider();
    return new MockResearchProvider();
  }

  researchFallbackChain(): I.ResearchProvider[] {
    const chain: I.ResearchProvider[] = [];
    if (hasKey("TAVILY_API_KEY")) chain.push(new TavilyResearchProvider());
    chain.push(new MockResearchProvider());
    return chain;
  }

  image(): I.ImageProvider {
    if ((process.env.IMAGE_PROVIDER || "openai") === "openai" && hasKey("OPENAI_API_KEY")) return new OpenAIImageProvider();
    return new MockImageProvider();
  }

  imageFallbackChain(): I.ImageProvider[] {
    const chain: I.ImageProvider[] = [];
    if (hasKey("OPENAI_API_KEY")) chain.push(new OpenAIImageProvider());
    chain.push(new MockImageProvider());
    return chain;
  }

  stock(): I.StockMediaProvider {
    if ((process.env.STOCK_PROVIDER || "pexels") === "pexels" && hasKey("PEXELS_API_KEY")) return new PexelsStockProvider();
    return new MockStockProvider();
  }

  video(): I.VideoProvider {
    if ((process.env.VIDEO_PROVIDER || "runway") === "runway" && hasKey("RUNWAY_API_KEY")) return new RunwayVideoProvider();
    return new MockVideoProvider();
  }

  videoFallbackChain(): I.VideoProvider[] {
    const chain: I.VideoProvider[] = [];
    if (hasKey("RUNWAY_API_KEY")) chain.push(new RunwayVideoProvider());
    chain.push(new MockVideoProvider());
    return chain;
  }

  voice(): I.VoiceProvider {
    const pref = process.env.VOICE_PROVIDER || "elevenlabs";
    if (pref === "elevenlabs" && hasKey("ELEVENLABS_API_KEY")) return new ElevenLabsVoiceProvider();
    if (hasKey("OPENAI_API_KEY")) return new OpenAITTSProvider();
    return new MockVoiceProvider();
  }

  voiceFallbackChain(): I.VoiceProvider[] {
    const chain: I.VoiceProvider[] = [];
    if (hasKey("OPENAI_API_KEY")) chain.push(new OpenAITTSProvider());
    chain.push(new MockVoiceProvider());
    return chain;
  }

  avatar(): I.AvatarProvider {
    const pref = process.env.AVATAR_PROVIDER || "did";
    if (pref === "did" && hasKey("DID_API_KEY")) return new DIDAvatarProvider();
    if (pref === "heygen" && hasKey("HEYGEN_API_KEY")) return new HeyGenAvatarProvider();
    return new MockAvatarProvider();
  }

  avatarFallbackChain(): I.AvatarProvider[] {
    const chain: I.AvatarProvider[] = [];
    if (hasKey("DID_API_KEY")) chain.push(new DIDAvatarProvider());
    if (hasKey("HEYGEN_API_KEY")) chain.push(new HeyGenAvatarProvider());
    chain.push(new MockAvatarProvider());
    return chain;
  }

  lipsync(): I.LipSyncProvider {
    if ((process.env.LIPSYNC_PROVIDER || "syncso") === "syncso" && hasKey("SYNC_API_KEY")) return new SyncSoLipSyncProvider();
    return new MockLipSyncProvider();
  }

  lipsyncFallbackChain(): I.LipSyncProvider[] {
    const chain: I.LipSyncProvider[] = [];
    if (hasKey("SYNC_API_KEY")) chain.push(new SyncSoLipSyncProvider());
    chain.push(new MockLipSyncProvider());
    return chain;
  }

  music(): I.MusicProvider {
    if ((process.env.MUSIC_PROVIDER || "mubert") === "mubert" && hasKey("MUBERT_API_KEY")) return new MubertMusicProvider();
    return new MockMusicProvider();
  }

  musicFallbackChain(): I.MusicProvider[] {
    const chain: I.MusicProvider[] = [];
    if (hasKey("MUBERT_API_KEY")) chain.push(new MubertMusicProvider());
    chain.push(new MockMusicProvider());
    return chain;
  }

  sfx(): I.SfxProvider { return new LocalSfxProvider(); }

  transcription(): I.TranscriptionProvider {
    if ((process.env.TRANSCRIPTION_PROVIDER || "whisper") === "whisper" && hasKey("OPENAI_API_KEY")) return new WhisperTranscriptionProvider();
    return new MockTranscriptionProvider();
  }

  transcriptionFallbackChain(): I.TranscriptionProvider[] {
    const chain: I.TranscriptionProvider[] = [];
    if (hasKey("OPENAI_API_KEY")) chain.push(new WhisperTranscriptionProvider());
    chain.push(new MockTranscriptionProvider());
    return chain;
  }
}

export const providers = new ProviderRegistry();
export * from "./interfaces";