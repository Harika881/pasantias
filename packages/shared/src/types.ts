// FILE: packages/shared/src/types.ts
export type VisualType =
  | "avatar" | "b_roll_video" | "b_roll_image" | "stock_video" | "stock_image"
  | "chart" | "infographic" | "map" | "screen_animation" | "motion_graphics" | "code";

export type InteractionType =
  | "none" | "pause_guess" | "prediction" | "quiz" | "countdown"
  | "comparison" | "poll" | "before_after";

export interface SceneSchema {
  scene_id: number;
  start_time: number;
  end_time: number;
  narration: string;
  visual_type: VisualType;
  visual_prompt: string;
  b_roll?: string;
  on_screen_text?: string;
  camera?: "static" | "slow_zoom_in" | "slow_zoom_out" | "pan_left" | "pan_right";
  transition?: "cut" | "fade" | "whip_pan" | "slide" | "zoom_punch";
  music_cue?: string;
  sound_effect?: string;
  caption?: string;
  interaction?: InteractionType;
  keywords_to_highlight?: string[];
}

export interface ScriptSection {
  type: "hook" | "intro" | "body" | "engagement" | "ending";
  text: string;
}

export interface GeneratedScript {
  title_candidates: string[];
  sections: ScriptSection[];
  full_text: string;
  estimated_duration_seconds: number;
}

export interface ContentAnalysis {
  main_topic: string;
  key_points: string[];
  claims: { text: string; confidence: "verified" | "estimate" | "opinion" | "generated" }[];
  entities: string[];
  important_numbers: string[];
  emotional_tone: string;
  target_audience: string;
  likely_viewer_questions: string[];
  potential_hooks: string[];
  visual_opportunities: string[];
  uncertain_claims: string[];
}

export interface WordTimestamp { word: string; start: number; end: number; }

export interface VoiceResult {
  audioUrl: string;
  durationSec: number;
  words: WordTimestamp[];
}

export interface CreateVideoRequest {
  userId: string;
  topicOrText: string;
  audience?: string;
  durationSeconds?: number;
  language?: string;
  style?: string;
  presenterStyle?: string;
  category?: string;
  qualityPreset?: "FAST" | "BALANCED" | "HIGH_QUALITY" | "LOW_COST";
  aspectRatio?: "16:9" | "9:16" | "1:1" | "4:5";
  generateShorts?: boolean;
}

export const PIPELINE_STAGES = [
  "content_analysis", "research", "script_generation", "retention_optimization",
  "scene_planning", "visual_generation", "voice_generation", "avatar_generation",
  "lip_sync", "captioning", "music_sfx", "composition", "quality_control",
  "thumbnail_metadata", "shorts_generation", "done",
] as const;
export type PipelineStage = typeof PIPELINE_STAGES[number];

export interface JobProgress {
  stage: PipelineStage;
  status: "pending" | "running" | "completed" | "failed";
  message?: string;
  progressPct?: number;
}