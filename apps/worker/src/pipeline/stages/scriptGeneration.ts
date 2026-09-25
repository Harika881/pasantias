// FILE: apps/worker/src/pipeline/stages/scriptGeneration.ts
import { prisma } from "@studio/db";
import { providers } from "@studio/providers";
import { withFallback } from "@studio/shared";
import { PipelineContext } from "../orchestrator";

export async function runScriptGeneration(ctx: PipelineContext) {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: ctx.projectId } });
  const chain = providers.llmFallbackChain();

  const { result: script, providerUsed } = await withFallback(
    chain.map((llm) => ({
      name: llm.name,
      run: () => llm.generateScript({
        analysis: ctx.analysis, researchNotes: ctx.research?.summary,
        durationSeconds: project.durationTargetSec || 420,
        language: project.language, style: project.style || undefined, tone: ctx.analysis.emotional_tone,
      }),
    })),
    { retries: 1 }
  );

  ctx.script = script;
  const row = await prisma.script.create({
    data: { projectId: ctx.projectId, fullText: script.full_text, sectionsJson: script.sections as any },
  });
  ctx.scriptId = row.id;
  ctx.llmProviderUsed = providerUsed;
}