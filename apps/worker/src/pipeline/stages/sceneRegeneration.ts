// FILE: apps/worker/src/pipeline/stages/sceneRegeneration.ts
import { prisma } from "@studio/db";
import { providers } from "@studio/providers";
import { withFallback } from "@studio/shared";
import { uploadLocalFile } from "../../services/storage";
import { composeFinalVideo } from "../../render/ffmpegEngine";

export async function regenerateScene(sceneId: string, field: "voice" | "visual" | "avatar" | "full") {
  const scene = await prisma.scene.findUniqueOrThrow({ where: { id: sceneId } });

  if (field === "voice" || field === "full") {
    const { result, providerUsed } = await withFallback(
      providers.voiceFallbackChain().map((provider) => ({ name: provider.name, run: () => provider.synthesize(scene.narration) })),
      { retries: 0 },
    );
    const stored = await uploadLocalFile(result.audioUrl, `projects/regen/${sceneId}`);
    const asset = await prisma.asset.create({ data: { sceneId, type: "audio", provider: providerUsed, url: stored.url, storageKey: stored.key, license: "generated" } });
    await prisma.audio.update({ where: { sceneId }, data: { assetId: asset.id, durationSec: result.durationSec, wordTimestampsJson: result.words as any } });
  }

  if (field === "visual" || field === "full") {
    const { result: gen, providerUsed } = await withFallback(
      providers.imageFallbackChain().map((provider) => ({ name: provider.name, run: () => provider.generateImage(scene.visualPrompt) })),
      { retries: 0 },
    );
    const stored = await uploadLocalFile(gen.localPath, `projects/regen/${sceneId}`);
    await prisma.asset.create({ data: { sceneId, type: "image", provider: providerUsed, url: stored.url, storageKey: stored.key, license: "generated" } });
  }

  if (field === "avatar" || field === "full") {
    const audioAsset = await prisma.asset.findFirst({ where: { sceneId, type: "audio" }, orderBy: { createdAt: "desc" } });
    if (audioAsset) {
      const { result, providerUsed } = await withFallback(
        providers.avatarFallbackChain().map((provider) => ({
          name: provider.name,
          run: () => provider.generateTalkingVideo({ audioUrl: audioAsset.url, script: scene.narration, avatarConfig: {} }),
        })),
        { retries: 0 },
      );
      const stored = await uploadLocalFile(result.localPath, `projects/regen/${sceneId}`);
      await prisma.asset.create({ data: { sceneId, type: "video", provider: providerUsed, url: stored.url, storageKey: stored.key, license: "generated", metadata: { alreadyLipSynced: result.alreadyLipSynced } } });
    }
  }

  await prisma.scene.update({ where: { id: sceneId }, data: { status: "ready" } });

  const project = await prisma.project.findFirstOrThrow({ where: { scripts: { some: { id: scene.scriptId } } } });
  const allScenes = await prisma.scene.findMany({ where: { scriptId: scene.scriptId }, orderBy: { sceneIndex: "asc" }, include: { assets: true, audio: true } });
  const musicAsset = await prisma.asset.findFirst({ where: { projectId: project.id, type: "music" } });
  const outputPath = await composeFinalVideo({ projectId: project.id, scenes: allScenes, musicUrl: musicAsset?.url, aspectRatio: project.aspectRatio as any });
  const stored = await uploadLocalFile(outputPath, `projects/${project.id}/final`);
  await prisma.video.updateMany({ where: { projectId: project.id }, data: { finalUrl: stored.url } });
}