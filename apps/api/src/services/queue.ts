// FILE: apps/api/src/services/queue.ts
import { Queue } from "bullmq";
import IORedis from "ioredis";

export const connection = new IORedis(process.env.REDIS_URL!, { maxRetriesPerRequest: null });
export const videoQueue = new Queue("video-production", { connection });
export const sceneQueue = new Queue("scene-regeneration", { connection });