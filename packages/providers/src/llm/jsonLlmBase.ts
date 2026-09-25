// FILE: packages/providers/src/llm/jsonLlmBase.ts
import { LLMProvider } from "../interfaces";
import { ContentAnalysis, GeneratedScript, SceneSchema } from "@studio/shared";
import { completeJsonWithRepair } from "../utils/jsonRepair";
import * as P from "./promptTemplates";

export abstract class JsonLLMBase implements LLMProvider {
  abstract name: string;
  protected abstract complete(system: string, user: string): Promise<string>;
  protected supportsNativeJsonMode = false;

  private async json<T>(system: string, user: string): Promise<T> {
    return completeJsonWithRepair<T>((s, u) => this.complete(s, u), system, user);
  }

  chatJSON<T>(system: string, user: string) { return this.json<T>(system, user); }

  analyzeContent(input: string, opts?: { audience?: string }): Promise<ContentAnalysis> {
    return this.json<ContentAnalysis>(P.ANALYZE_SYSTEM, P.analyzeUser(input, opts?.audience));
  }

  generateScript(params: {
    analysis: ContentAnalysis; researchNotes?: string; durationSeconds?: number;
    language?: string; style?: string; tone?: string;
  }): Promise<GeneratedScript> {
    return this.json<GeneratedScript>(P.SCRIPT_SYSTEM, P.scriptUser(params));
  }

  reviseForRetention(script: GeneratedScript, critique: string): Promise<GeneratedScript> {
    return this.json<GeneratedScript>(
      P.RETENTION_REVISE_SYSTEM,
      `ORIGINAL SCRIPT:\n${JSON.stringify(script)}\n\nCRITIQUE TO FIX:\n${critique}`
    );
  }

  async planScenes(script: GeneratedScript, targetDurationSec: number): Promise<SceneSchema[]> {
    const result = await this.json<{ scenes: SceneSchema[] }>(
      P.SCENE_PLAN_SYSTEM, P.scenePlanUser(script.full_text, targetDurationSec)
    );
    return result.scenes;
  }

  critiqueRetention(script: GeneratedScript, scenes: SceneSchema[]): Promise<{ score: number; notes: string }> {
    return this.json(P.RETENTION_CRITIQUE_SYSTEM, `SCRIPT:\n${script.full_text}\n\nSCENES:\n${JSON.stringify(scenes)}`);
  }

  generateMetadata(script: GeneratedScript) {
    return this.json(
      P.METADATA_SYSTEM,
      `SCRIPT:\n${script.full_text}\n\nTITLE IDEAS:\n${script.title_candidates.join(", ")}`
    );
  }
}