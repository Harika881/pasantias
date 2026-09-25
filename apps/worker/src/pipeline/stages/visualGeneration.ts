// FILE: apps/worker/src/pipeline/stages/visualGeneration.ts
import { prisma } from "@studio/db";
import { providers } from "@studio/providers";
import { withFallback } from "@studio/shared";
import { uploadLocalFile } from "../../services/storage";
import { PipelineContext } from "../orchestrator";

export async function runVisualGeneration(ctx: PipelineContext) {
  const scenes = await prisma.scene.findMany({ where: { scriptId: ctx.scriptId } });
  const stock = providers.stock();
  const imageChain = providers.imageFallbackChain();
  const videoChain = providers.videoFallbackChain();
  const generateImage = (prompt: string) => withFallback(
    imageChain.map((provider) => ({ name: provider.name, run: () => provider.generateImage(prompt) })),
    { retries: 0 },
  );

  for (const scene of scenes) {
    try {
      let asset: { url: string; localPath: string; license?: string; type: string };

      if (scene.visualType === "stock_video" || scene.visualType === "b_roll_video") {
        const found = await stock.searchVideo(scene.visualPrompt);
        if (found) asset = { ...found, localPath: found.url, type: "video" };
        else if (videoChain.length > 0) {
          const { result: gen } = await withFallback(
            videoChain.map((provider) => ({
              name: provider.name,
              run: () => provider.generateClip(scene.visualPrompt, Math.max(3, scene.endTime - scene.startTime)),
            })),
            { retries: 0 },
          );
          asset = { ...gen, license: "generated", type: "video" };
        } else {
          const { result: gen } = await generateImage(scene.visualPrompt);
          asset = { ...gen, license: "generated", type: "image" };
        }
      } else if (scene.visualType === "stock_image" || scene.visualType === "b_roll_image") {
        const found = await stock.searchImage(scene.visualPrompt);
        if (found) asset = { ...found, localPath: found.url, type: "image" };
        else { const { result: gen } = await generateImage(scene.visualPrompt); asset = { ...gen, license: "generated", type: "image" }; }
      } else {
        const { result: gen } = await generateImage(`${scene.visualType} style illustration: ${scene.visualPrompt}`);
        asset = { ...gen, license: "generated", type: "image" };
      }

      const stored = await uploadLocalFile(asset.localPath, `projects/${ctx.projectId}/scenes/${scene.id}`);
      await prisma.asset.create({
        data: { sceneId: scene.id, type: asset.type, provider: providers.stock().name, url: stored.url, storageKey: stored.key, license: asset.license || "unknown" },
      });
    } catch (err: any) {
      const { result: gen } = await generateImage(scene.visualPrompt);
      const stored = await uploadLocalFile(gen.localPath, `projects/${ctx.projectId}/scenes/${scene.id}`);
      await prisma.asset.create({ data: { sceneId: scene.id, type: "image", provider: "mock-fallback", url: stored.url, storageKey: stored.key, license: "generated" } });
    }
  }
}