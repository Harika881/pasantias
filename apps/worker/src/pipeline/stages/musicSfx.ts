// FILE: apps/worker/src/pipeline/stages/musicSfx.ts
import { prisma } from "@studio/db";
import { providers } from "@studio/providers";
import { withFallback } from "@studio/shared";
import { uploadLocalFile } from "../../services/storage";
import { PipelineContext } from "../orchestrator";

export async function runMusicSfx(ctx: PipelineContext) {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: ctx.projectId } });
  const scenes = await prisma.scene.findMany({ where: { scriptId: ctx.scriptId } });
  const totalDuration = Math.max(...scenes.map((s) => s.endTime));
  const musicChain = providers.musicFallbackChain();
  const sfx = providers.sfx();

  const mood = project.style?.includes("dark") ? "dark cinematic" : "upbeat curious documentary";
  const { result: track } = await withFallback(
    musicChain.map((provider) => ({ name: provider.name, run: () => provider.getTrack(mood, Math.ceil(totalDuration)) })),
    { retries: 0 },
  );
  const storedMusic = await uploadLocalFile(track.localPath, `projects/${ctx.projectId}/music`);
  await prisma.asset.create({ data: { projectId: ctx.projectId, type: "music", url: storedMusic.url, storageKey: storedMusic.key, license: "generated" } });

  for (const scene of scenes) {
    if (!scene.soundEffect) continue;
    const effect = await sfx.getEffect(scene.soundEffect);
    if (!effect) continue;
    const storedSfx = await uploadLocalFile(effect.localPath, `projects/${ctx.projectId}/scenes/${scene.id}`);
    await prisma.asset.create({ data: { sceneId: scene.id, type: "sfx", url: storedSfx.url, storageKey: storedSfx.key, license: "cc0" } });
  }
}