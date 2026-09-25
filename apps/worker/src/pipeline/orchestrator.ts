// FILE: apps/worker/src/pipeline/orchestrator.ts
import { prisma } from "@studio/db";
import { logger, PipelineStage } from "@studio/shared";
import { runContentAnalysis } from "./stages/contentAnalysis";
import { runResearch } from "./stages/research";
import { runScriptGeneration } from "./stages/scriptGeneration";
import { runRetentionOptimization } from "./stages/retentionOptimizer";
import { runScenePlanning } from "./stages/scenePlanning";
import { runVisualGeneration } from "./stages/visualGeneration";
import { runVoiceGeneration } from "./stages/voiceGeneration";
import { runAvatarGeneration } from "./stages/avatarGeneration";
import { runLipSync } from "./stages/lipSync";
import { runCaptionGeneration } from "./stages/captionGeneration";
import { runMusicSfx } from "./stages/musicSfx";
import { runComposition } from "./stages/composition";
import { runQualityControl } from "./stages/qualityControl";
import { runThumbnailMetadata } from "./stages/thumbnailMetadata";
import { runShortsGeneration } from "./stages/shortsGeneration";

export interface PipelineContext {
  projectId: string;
  analysis?: any; research?: any; script?: any; scenes?: any[]; scriptId?: string;
  llmProviderUsed?: string;
}

export async function runProductionPipeline(projectId: string, generateShorts = false) {
  const ctx: PipelineContext = { projectId };

  const stages: { stage: PipelineStage; run: () => Promise<void> }[] = [
    { stage: "content_analysis", run: () => runContentAnalysis(ctx) },
    { stage: "research", run: () => runResearch(ctx) },
    { stage: "script_generation", run: () => runScriptGeneration(ctx) },
    { stage: "retention_optimization", run: () => runRetentionOptimization(ctx) },
    { stage: "scene_planning", run: () => runScenePlanning(ctx) },
    { stage: "visual_generation", run: () => runVisualGeneration(ctx) },
    { stage: "voice_generation", run: () => runVoiceGeneration(ctx) },
    { stage: "avatar_generation", run: () => runAvatarGeneration(ctx) },
    { stage: "lip_sync", run: () => runLipSync(ctx) },
    { stage: "captioning", run: () => runCaptionGeneration(ctx) },
    { stage: "music_sfx", run: () => runMusicSfx(ctx) },
    { stage: "composition", run: () => runComposition(ctx) },
    { stage: "quality_control", run: () => runQualityControl(ctx) },
    { stage: "thumbnail_metadata", run: () => runThumbnailMetadata(ctx) },
    ...(generateShorts ? [{ stage: "shorts_generation" as PipelineStage, run: () => runShortsGeneration(ctx) }] : []),
  ];

  for (const s of stages) {
    const jobRow = await prisma.generationJob.create({
      data: { projectId, stage: s.stage, status: "running", startedAt: new Date() },
    });
    try {
      logger.info({ projectId, stage: s.stage }, "Pipeline stage starting");
      await s.run();
      await prisma.generationJob.update({ where: { id: jobRow.id }, data: { status: "completed", progressPct: 100, finishedAt: new Date() } });
    } catch (err: any) {
      logger.error({ projectId, stage: s.stage, err: err?.message }, "Pipeline stage failed");
      await prisma.generationJob.update({ where: { id: jobRow.id }, data: { status: "failed", message: err?.message, finishedAt: new Date() } });
      await prisma.project.update({ where: { id: projectId }, data: { status: "failed" } });
      return;
    }
  }

  await prisma.project.update({ where: { id: projectId }, data: { status: "ready" } });
}