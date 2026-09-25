// FILE: apps/api/src/routes/jobs.ts
import { Router } from "express";
import { prisma } from "@studio/db";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/project/:projectId", async (req, res, next) => {
  try {
    const jobs = await prisma.generationJob.findMany({
      where: { projectId: req.params.projectId }, orderBy: { createdAt: "asc" },
    });
    const project = await prisma.project.findUnique({ where: { id: req.params.projectId } });
    res.json({ status: project?.status, jobs });
  } catch (e) { next(e); }
});

export default router;