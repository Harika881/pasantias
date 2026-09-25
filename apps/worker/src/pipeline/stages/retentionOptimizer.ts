// FILE: apps/worker/src/pipeline/stages/retentionOptimizer.ts
import { prisma } from "@studio/db";
import { providers } from "@studio/providers";
import { withFallback } from "@studio/shared";
import { PipelineContext } from "../orchestrator";

export async function runRetentionOptimization(ctx: PipelineContext) {
  const { result, providerUsed } = await withFallback(
    providers.llmFallbackChain().map((llm) => ({
      name: llm.name,
      run: async () => {
        const scenesGuess = await llm.planScenes(ctx.script, ctx.script.estimated_duration_seconds);
        const critique = await llm.critiqueRetention(ctx.script, scenesGuess);
        const script = critique.score < 75
          ? await llm.reviseForRetention(ctx.script, critique.notes)
          : ctx.script;
        return { critique, script };
      },
    })),
    { retries: 0 },
  );

  ctx.script = result.script;
  const { critique } = result;
  ctx.llmProviderUsed = providerUsed;

  await prisma.script.update({
    where: { id: ctx.scriptId }, data: { retentionScore: critique.score, fullText: ctx.script.full_text, sectionsJson: ctx.script.sections as any },
  });
}