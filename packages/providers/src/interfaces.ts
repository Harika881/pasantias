// FILE: packages/providers/src/interfaces.ts
import { ContentAnalysis, GeneratedScript, SceneSchema, VoiceResult } from "@studio/shared";

export interface LLMProvider {
  name: string;
  analyzeContent(input: string, opts?: { audience?: string }): Promise<ContentAnalysis>;
  generateScript(params: {
    analysis: ContentAnalysis; researchNotes?: string; durationSeconds?: number;
    language?: string; style?: string; tone?: string;
  }): Promise<GeneratedScript>;
  reviseForRetention(script: GeneratedScript, critique: string): Promise<GeneratedScript>;
  planScenes(script: GeneratedScript, targetDurationSec: number): Promise<SceneSchema[]>;
  critiqueRetention(script: GeneratedScript, scenes: SceneSchema[]): Promise<{ score: number; notes: string }>;
  generateMetadata(script: GeneratedScript): Promise<{
    titles: string[]; description: string; tags: string[]; hashtags: string[];
    chapters: { time: number; title: string }[];
  }>;
  chatJSON<T>(system: string, user: string): Promise<T>;
}

export interface ResearchProvider {
  name: string;
  research(topic: string): Promise<{ summary: string; sources: { title: string; url: string }[] }>;
}

export interface ImageProvider {
  name: string;
  generateImage(prompt: string, opts?: { width?: number; height?: number }): Promise<{ url: string; localPath: string }>;
}

export interface StockMediaProvider {
  name: string;
  searchVideo(query: string): Promise<{ url: string; license: string } | null>;
  searchImage(query: string): Promise<{ url: string; license: string } | null>;
}

export interface VideoProvider {
  name: string;
  generateClip(prompt: string, durationSec: number): Promise<{ url: string; localPath: string }>;
}

export interface VoiceProvider {
  name: string;
  synthesize(text: string, opts?: {
    voiceId?: string; language?: string; speed?: number; emotion?: string;
  }): Promise<VoiceResult>;
}

export interface AvatarProvider {
  name: string;
  generateTalkingVideo(params: {
    audioUrl: string; script: string; avatarConfig: Record<string, unknown>;
  }): Promise<{ videoUrl: string; localPath: string; alreadyLipSynced: boolean }>;
}

export interface LipSyncProvider {
  name: string;
  sync(params: { videoUrl: string; audioUrl: string }): Promise<{ videoUrl: string; localPath: string }>;
}

export interface MusicProvider {
  name: string;
  getTrack(mood: string, durationSec: number): Promise<{ url: string; localPath: string }>;
}

export interface SfxProvider {
  name: string;
  getEffect(kind: string): Promise<{ url: string; localPath: string } | null>;
}

export interface TranscriptionProvider {
  name: string;
  transcribe(audioPath: string): Promise<{ words: { word: string; start: number; end: number }[] }>;
}