// FILE: apps/api/src/routes/projects.ts
import { Router } from "express";
import { prisma } from "@studio/db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { userId: req.userId }, orderBy: { createdAt: "desc" },
      include: { videos: true },
    });
    res.json(projects);
  } catch (e) { next(e); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { scripts: { include: { scenes: { include: { assets: true, audio: true } } } }, videos: true, jobs: true },
    });
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(project);
  } catch (e) { next(e); }
});

export default router;