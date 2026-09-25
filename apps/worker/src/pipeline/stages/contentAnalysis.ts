// FILE: apps/worker/src/pipeline/stages/contentAnalysis.ts
import { prisma } from "@studio/db";
import { providers } from "@studio/providers";
import { withFallback } from "@studio/shared";
import { PipelineContext } from "../orchestrator";

export async function runContentAnalysis(ctx: PipelineContext) {
  const project = await prisma.project.findUniqueOrThrow({ where: { id: ctx.projectId } });
  const { result, providerUsed } = await withFallback(
    providers.llmFallbackChain().map((llm) => ({
      name: llm.name,
      run: () => llm.analyzeContent(project.inputText, { audience: project.audience || undefined }),
    })),
    { retries: 0 },
  );
  ctx.analysis = result;
  ctx.llmProviderUsed = providerUsed;
}