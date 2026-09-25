// FILE: apps/worker/src/pipeline/stages/avatarGeneration.ts
import { prisma } from "@studio/db";
import { providers } from "@studio/providers";
import { withFallback } from "@studio/shared";
import { uploadLocalFile } from "../../services/storage";
import { PipelineContext } from "../orchestrator";

export async function runAvatarGeneration(ctx: PipelineContext) {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: ctx.projectId } });
  const scenes = await prisma.scene.findMany({ where: { scriptId: ctx.scriptId, visualType: "avatar" } });
  const avatarChain = providers.avatarFallbackChain();

  const avatarConfig = { presenterStyle: project.presenterStyle || "professional, friendly", imageUrl: undefined };
  await prisma.avatar.create({ data: { projectId: ctx.projectId, provider: avatarChain[0].name, config: avatarConfig } });

  for (const scene of scenes) {
    const audioAsset = await prisma.asset.findFirst({ where: { sceneId: scene.id, type: "audio" } });
    if (!audioAsset) continue;
    const { result, providerUsed } = await withFallback(
      avatarChain.map((provider) => ({
        name: provider.name,
        run: () => provider.generateTalkingVideo({ audioUrl: audioAsset.url, script: scene.narration, avatarConfig }),
      })),
      { retries: 0 },
    );
    const stored = await uploadLocalFile(result.localPath, `projects/${ctx.projectId}/scenes/${scene.id}`);
    await prisma.asset.create({
      data: { sceneId: scene.id, type: "video", provider: providerUsed, url: stored.url, storageKey: stored.key,
        license: "generated", metadata: { alreadyLipSynced: result.alreadyLipSynced } },
    });
  }
}