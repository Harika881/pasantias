// FILE: apps/worker/src/pipeline/stages/thumbnailMetadata.ts
import { prisma } from "@studio/db";
import { providers } from "@studio/providers";
import { withFallback } from "@studio/shared";
import { PipelineContext } from "../orchestrator";
import { renderThumbnail } from "../../render/thumbnail";
import { uploadLocalFile } from "../../services/storage";

export async function runThumbnailMetadata(ctx: PipelineContext) {
  const { result: meta, providerUsed } = await withFallback(
    providers.llmFallbackChain().map((llm) => ({
      name: llm.name,
      run: () => llm.generateMetadata(ctx.script),
    })),
    { retries: 0 },
  );
  ctx.llmProviderUsed = providerUsed;

  const imageChain = providers.imageFallbackChain();
  const thumbUrls: string[] = [];
  const concepts = [ctx.script.title_candidates[0], ctx.script.title_candidates[1], "curiosity close-up expression"];
  for (const concept of concepts.slice(0, 3)) {
    const { result: bg } = await withFallback(
      imageChain.map((provider) => ({
        name: provider.name,
        run: () => provider.generateImage(`YouTube thumbnail background, bold, high contrast, related to: ${ctx.analysis.main_topic}, ${concept}`, { width: 1280, height: 720 }),
      })),
      { retries: 0 },
    );
    const finalPath = await renderThumbnail(bg.localPath, concept);
    const stored = await uploadLocalFile(finalPath, `projects/${ctx.projectId}/thumbnails`);
    thumbUrls.push(stored.url);
  }

  const video = await prisma.video.findFirstOrThrow({ where: { projectId: ctx.projectId }, orderBy: { createdAt: "desc" } });
  await prisma.video.update({
    where: { id: video.id },
    data: { thumbnailUrls: thumbUrls as any, titleOptions: meta.titles as any, description: meta.description, tags: meta.tags as any, chapters: meta.chapters as any },
  });
}