// FILE: apps/worker/src/pipeline/stages/voiceGeneration.ts
import { prisma } from "@studio/db";
import { providers } from "@studio/providers";
import { withFallback } from "@studio/shared";
import { uploadLocalFile } from "../../services/storage";
import { PipelineContext } from "../orchestrator";

export async function runVoiceGeneration(ctx: PipelineContext) {
  const scenes = await prisma.scene.findMany({ where: { scriptId: ctx.scriptId } });
  const voiceChain = providers.voiceFallbackChain();
  const synthesize = (text: string) => withFallback(
    voiceChain.map((provider) => ({ name: provider.name, run: () => provider.synthesize(text, { language: "en" }) })),
    { retries: 0 },
  );

  for (const scene of scenes) {
    const { result, providerUsed } = await synthesize(scene.narration);
    const stored = await uploadLocalFile(result.audioUrl, `projects/${ctx.projectId}/scenes/${scene.id}`);
    const asset = await prisma.asset.create({
      data: { sceneId: scene.id, type: "audio", provider: providerUsed, url: stored.url, storageKey: stored.key, license: "generated" },
    });
    await prisma.audio.upsert({
      where: { sceneId: scene.id },
      update: { assetId: asset.id, durationSec: result.durationSec, wordTimestampsJson: result.words as any },
      create: { sceneId: scene.id, assetId: asset.id, durationSec: result.durationSec, wordTimestampsJson: result.words as any },
    });
  }
}