// FILE: apps/api/src/routes/scenes.ts
import { Router } from "express";
import { prisma } from "@studio/db";
import { requireAuth } from "../middleware/auth";
import { sceneQueue } from "../services/queue";

const router = Router();
router.use(requireAuth);

router.post("/:sceneId/regenerate", async (req, res, next) => {
  try {
    const { field } = req.body as { field: "voice" | "visual" | "avatar" | "full" };
    const scene = await prisma.scene.findUnique({ where: { id: req.params.sceneId } });
    if (!scene) return res.status(404).json({ error: "Scene not found" });
    await prisma.scene.update({ where: { id: scene.id }, data: { status: "generating" } });
    await sceneQueue.add("regenerate-scene", { sceneId: scene.id, field: field || "full" });
    res.status(202).json({ status: "queued" });
  } catch (e) { next(e); }
});

router.patch("/:sceneId", async (req, res, next) => {
  try {
    const { narration, onScreenText, caption } = req.body;
    const scene = await prisma.scene.update({
      where: { id: req.params.sceneId },
      data: { narration, onScreenText, caption },
    });
    res.json(scene);
  } catch (e) { next(e); }
});

export default router;