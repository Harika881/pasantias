// FILE: apps/worker/src/pipeline/stages/captionGeneration.ts
import { prisma } from "@studio/db";
import { providers } from "@studio/providers";
import { withFallback } from "@studio/shared";
import { PipelineContext } from "../orchestrator";
import { buildAssTrack } from "../../render/captionRenderer";
import { uploadLocalFile } from "../../services/storage";

export async function runCaptionGeneration(ctx: PipelineContext) {
  const scenes = await prisma.scene.findMany({ where: { scriptId: ctx.scriptId }, include: { audio: true } });
  const transcriptionChain = providers.transcriptionFallbackChain();

  for (const scene of scenes) {
    if (!scene.audio) continue;
    let words = scene.audio.wordTimestampsJson as any[];
    if (!words || words.length === 0) {
      const audioAsset = await prisma.asset.findFirst({ where: { sceneId: scene.id, type: "audio" } });
      if (audioAsset) {
        const { result: t } = await withFallback(
          transcriptionChain.map((provider) => ({ name: provider.name, run: () => provider.transcribe(audioAsset.url) })),
          { retries: 0 },
        );
        words = t.words;
        await prisma.audio.update({ where: { sceneId: scene.id }, data: { wordTimestampsJson: words as any } });
      }
    }
    const assPath = buildAssTrack(scene.id, words, scene.startTime);
    const stored = await uploadLocalFile(assPath, `projects/${ctx.projectId}/scenes/${scene.id}`);
    await prisma.asset.create({ data: { sceneId: scene.id, type: "caption", url: stored.url, storageKey: stored.key, license: "generated" } });
  }
}