// FILE: apps/worker/src/pipeline/stages/scenePlanning.ts
import { prisma } from "@studio/db";
import { providers } from "@studio/providers";
import { withFallback } from "@studio/shared";
import { PipelineContext } from "../orchestrator";

export async function runScenePlanning(ctx: PipelineContext) {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: ctx.projectId } });
  const { result: scenes, providerUsed } = await withFallback(
    providers.llmFallbackChain().map((llm) => ({
      name: llm.name,
      run: () => llm.planScenes(ctx.script, project.durationTargetSec || 420),
    })),
    { retries: 0 },
  );
  ctx.scenes = scenes;
  ctx.llmProviderUsed = providerUsed;

  for (const s of scenes) {
    await prisma.scene.create({
      data: {
        scriptId: ctx.scriptId!, sceneIndex: s.scene_id, startTime: s.start_time, endTime: s.end_time,
        narration: s.narration, visualType: s.visual_type, visualPrompt: s.visual_prompt,
        onScreenText: s.on_screen_text, camera: s.camera, transition: s.transition,
        musicCue: s.music_cue, soundEffect: s.sound_effect, caption: s.caption || s.narration,
        interaction: s.interaction, status: "pending",
      },
    });
  }
}