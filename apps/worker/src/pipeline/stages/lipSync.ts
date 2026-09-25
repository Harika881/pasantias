// FILE: apps/worker/src/pipeline/stages/lipSync.ts
import { prisma } from "@studio/db";
import { providers } from "@studio/providers";
import { withFallback } from "@studio/shared";
import { uploadLocalFile } from "../../services/storage";
import { PipelineContext } from "../orchestrator";

export async function runLipSync(ctx: PipelineContext) {
  const scenes = await prisma.scene.findMany({ where: { scriptId: ctx.scriptId, visualType: "avatar" } });
  const lipsyncChain = providers.lipsyncFallbackChain();

  for (const scene of scenes) {
    const videoAsset = await prisma.asset.findFirst({ where: { sceneId: scene.id, type: "video" }, orderBy: { createdAt: "desc" } });
    const audioAsset = await prisma.asset.findFirst({ where: { sceneId: scene.id, type: "audio" } });
    if (!videoAsset || !audioAsset) continue;
    const alreadySynced = (videoAsset.metadata as any)?.alreadyLipSynced;
    if (alreadySynced) continue;

    const { result, providerUsed } = await withFallback(
      lipsyncChain.map((provider) => ({
        name: provider.name,
        run: () => provider.sync({ videoUrl: videoAsset.url, audioUrl: audioAsset.url }),
      })),
      { retries: 0 },
    );
    const stored = await uploadLocalFile(result.localPath, `projects/${ctx.projectId}/scenes/${scene.id}`);
    await prisma.asset.create({
      data: { sceneId: scene.id, type: "video", provider: providerUsed, url: stored.url, storageKey: stored.key, license: "generated" },
    });
  }
}