// FILE: apps/worker/src/pipeline/stages/shortsGeneration.ts
import { prisma } from "@studio/db";
import { PipelineContext } from "../orchestrator";
import { extractShort } from "../../render/ffmpegEngine";
import { uploadLocalFile } from "../../services/storage";

export async function runShortsGeneration(ctx: PipelineContext) {
  const scenes = await prisma.scene.findMany({ where: { scriptId: ctx.scriptId }, orderBy: { sceneIndex: "asc" } });
  const video = await prisma.video.findFirstOrThrow({ where: { projectId: ctx.projectId }, orderBy: { createdAt: "desc" } });
  const candidates = scenes.filter((s) => s.interaction !== "none" || s.sceneIndex <= 2).slice(0, 3);

  for (const c of candidates) {
    const start = Math.max(0, c.startTime - 1);
    const end = Math.min(scenes[scenes.length - 1].endTime, c.endTime + 15);
    const localPath = await extractShort(video.finalUrl!, start, end);
    const stored = await uploadLocalFile(localPath, `projects/${ctx.projectId}/shorts`);
    await prisma.shortVideo.create({ data: { videoId: video.id, url: stored.url, startSec: start, endSec: end, hook: c.narration.slice(0, 60) } });
  }
}