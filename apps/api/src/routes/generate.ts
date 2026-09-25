// FILE: apps/api/src/routes/generate.ts
import { Router } from "express";
import { z } from "zod";
import { prisma } from "@studio/db";
import { requireAuth, AuthedRequest } from "../middleware/auth";
import { videoQueue } from "../services/queue";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  topicOrText: z.string().min(3),
  audience: z.string().optional(),
  durationSeconds: z.number().min(30).max(3600).optional(),
  language: z.string().optional(),
  style: z.string().optional(),
  presenterStyle: z.string().optional(),
  category: z.string().optional(),
  qualityPreset: z.enum(["FAST", "BALANCED", "HIGH_QUALITY", "LOW_COST"]).optional(),
  aspectRatio: z.enum(["16:9", "9:16", "1:1", "4:5"]).optional(),
  generateShorts: z.boolean().optional(),
});

router.post("/", async (req: AuthedRequest, res, next) => {
  try {
    const input = createSchema.parse(req.body);
    const project = await prisma.project.create({
      data: {
        userId: req.userId!,
        title: input.topicOrText.slice(0, 80),
        inputText: input.topicOrText,
        audience: input.audience,
        language: input.language || "en",
        style: input.style,
        presenterStyle: input.presenterStyle,
        category: input.category,
        durationTargetSec: input.durationSeconds || 420,
        qualityPreset: input.qualityPreset || "BALANCED",
        aspectRatio: input.aspectRatio || "16:9",
        status: "generating",
      },
    });

    await videoQueue.add("produce-video", { projectId: project.id, generateShorts: !!input.generateShorts }, {
      attempts: 1, removeOnComplete: true, removeOnFail: false,
    });

    res.status(202).json({ projectId: project.id, status: "queued" });
  } catch (e) { next(e); }
});

export default router;