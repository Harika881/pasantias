// FILE: apps/worker/src/pipeline/stages/qualityControl.ts
import { prisma } from "@studio/db";
import { PipelineContext } from "../orchestrator";
import { runQcChecks } from "../../render/qualityChecks";

export async function runQualityControl(ctx: PipelineContext) {
  const video = await prisma.video.findFirstOrThrow({ where: { projectId: ctx.projectId }, orderBy: { createdAt: "desc" } });
  const report = await runQcChecks(video.finalUrl!);
  await prisma.video.update({ where: { id: video.id }, data: { qcReportJson: report as any } });
  if (!report.passed) {
    await prisma.generationJob.create({ data: { projectId: ctx.projectId, stage: "quality_control", status: "completed", message: `QC warnings: ${report.issues.join("; ")}` } });
  }
}