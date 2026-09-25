// FILE: apps/worker/src/index.ts
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

import { Worker } from "bullmq";
import IORedis from "ioredis";
import { logger } from "@studio/shared";
import { runProductionPipeline } from "./pipeline/orchestrator";
import { regenerateScene } from "./pipeline/stages/sceneRegeneration";
import { publishToYouTube } from "./youtube/uploader";

const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });

new Worker("video-production", async (job) => {
  if (job.name === "produce-video") {
    await runProductionPipeline(job.data.projectId, job.data.generateShorts);
  } else if (job.name === "publish-youtube") {
    await publishToYouTube(job.data);
  }
}, { connection, concurrency: 2 });

new Worker("scene-regeneration", async (job) => {
  await regenerateScene(job.data.sceneId, job.data.field);
}, { connection, concurrency: 4 });

logger.info("Worker started, listening for jobs...");