// FILE: apps/api/src/routes/usage.ts
import { Router } from "express";
import { prisma } from "@studio/db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthedRequest, res, next) => {
  try {
    const records = await prisma.usageRecord.findMany({ where: { userId: req.userId }, orderBy: { createdAt: "desc" }, take: 200 });
    const total = records.reduce((s, r) => s + r.costUsd, 0);
    const byCategory: Record<string, number> = {};
    for (const r of records) byCategory[r.category] = (byCategory[r.category] || 0) + r.costUsd;
    res.json({ totalUsd: total, byCategory, records });
  } catch (e) { next(e); }
});

export default router;