// FILE: apps/api/src/routes/settings.ts
import { Router } from "express";
import crypto from "crypto";
import { prisma } from "@studio/db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

function encrypt(text: string) {
  const key = crypto.createHash("sha256").update(process.env.JWT_SECRET!).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64");
}

router.post("/providers", async (req: AuthedRequest, res, next) => {
  try {
    const { category, provider, apiKey, config } = req.body;
    const setting = await prisma.providerSetting.upsert({
      where: { userId_category: { userId: req.userId!, category } },
      update: { provider, apiKeyEnc: apiKey ? encrypt(apiKey) : undefined, config },
      create: { userId: req.userId!, category, provider, apiKeyEnc: apiKey ? encrypt(apiKey) : undefined, config },
    });
    res.json({ id: setting.id, category: setting.category, provider: setting.provider });
  } catch (e) { next(e); }
});

router.get("/providers", async (req: AuthedRequest, res, next) => {
  try {
    const settings = await prisma.providerSetting.findMany({ where: { userId: req.userId } });
    res.json(settings.map((s) => ({ category: s.category, provider: s.provider, configured: !!s.apiKeyEnc })));
  } catch (e) { next(e); }
});

export default router;