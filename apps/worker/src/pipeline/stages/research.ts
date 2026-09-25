// FILE: apps/worker/src/pipeline/stages/research.ts
import { providers } from "@studio/providers";
import { withFallback } from "@studio/shared";
import { PipelineContext } from "../orchestrator";

export async function runResearch(ctx: PipelineContext) {
  const { result, providerUsed } = await withFallback(
    providers.researchFallbackChain().map((provider) => ({
      name: provider.name,
      run: () => provider.research(ctx.analysis.main_topic),
    })),
    { retries: 0 },
  );
  ctx.research = result;
  ctx.llmProviderUsed = providerUsed;
}