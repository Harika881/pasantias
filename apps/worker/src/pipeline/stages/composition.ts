// FILE: apps/worker/src/pipeline/stages/composition.ts
import { prisma } from "@studio/db";
import { PipelineContext } from "../orchestrator";
import { composeFinalVideo } from "../../render/ffmpegEngine";
import { uploadLocalFile } from "../../services/storage";

export async function runComposition(ctx: PipelineContext) {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: ctx.projectId } });
  const scenes = await prisma.scene.findMany({
    where: { scriptId: ctx.scriptId }, orderBy: { sceneIndex: "asc" }, include: { assets: true, audio: true },
  });
  const musicAsset = await prisma.asset.findFirst({ where: { projectId: ctx.projectId, type: "music" } });

  const outputPath = await composeFinalVideo({
    projectId: ctx.projectId, scenes, musicUrl: musicAsset?.url, aspectRatio: project.aspectRatio as any,
  });

  const stored = await uploadLocalFile(outputPath, `projects/${ctx.projectId}/final`);
  await prisma.video.create({ data: { projectId: ctx.projectId, status: "pending", finalUrl: stored.url, aspectRatio: project.aspectRatio } });
}