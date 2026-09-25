// FILE: apps/api/src/routes/youtube.ts
import { Router } from "express";
import { google } from "googleapis";
import crypto from "crypto";
import { prisma } from "@studio/db";
import { requireAuth, AuthedRequest } from "../middleware/auth";

const router = Router();

function oauthClient() {
  return new google.auth.OAuth2(process.env.YT_CLIENT_ID, process.env.YT_CLIENT_SECRET, process.env.YT_REDIRECT_URI);
}
function encrypt(text: string) {
  const key = crypto.createHash("sha256").update(process.env.JWT_SECRET!).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString("base64");
}

router.get("/oauth/url", requireAuth, (req: AuthedRequest, res) => {
  const client = oauthClient();
  const url = client.generateAuthUrl({
    access_type: "offline", prompt: "consent",
    scope: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"],
    state: req.userId,
  });
  res.json({ url });
});

router.get("/oauth/callback", async (req, res, next) => {
  try {
    const client = oauthClient();
    const { tokens } = await client.getToken(req.query.code as string);
    client.setCredentials(tokens);
    const yt = google.youtube({ version: "v3", auth: client });
    const channelRes = await yt.channels.list({ part: ["snippet"], mine: true });
    const channel = channelRes.data.items?.[0];
    if (!channel) throw new Error("No YouTube channel found for this account");

    await prisma.youTubeChannel.create({
      data: {
        userId: req.query.state as string,
        channelId: channel.id!,
        channelTitle: channel.snippet?.title || "Unknown",
        accessTokenEnc: encrypt(tokens.access_token || ""),
        refreshTokenEnc: encrypt(tokens.refresh_token || ""),
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    });
    res.redirect((process.env.WEB_ORIGIN || "http://localhost:3000") + "/settings/youtube?connected=1");
  } catch (e) { next(e); }
});

router.get("/channels", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const channels = await prisma.youTubeChannel.findMany({ where: { userId: req.userId } });
    res.json(channels.map((c) => ({ id: c.id, channelTitle: c.channelTitle })));
  } catch (e) { next(e); }
});

router.post("/publish", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const body = req.body as { videoId: string; channelDbId: string; title: string; description: string; tags: string[]; privacy: "private" | "unlisted" | "public"; };
    const privacy = body.privacy === "public" ? "public" : (body.privacy || "private");
    const job = await prisma.publishingJob.create({
      data: { projectId: body.videoId, channelId: body.channelDbId, status: "pending", privacy },
    });
    const { videoQueue } = await import("../services/queue");
    await videoQueue.add("publish-youtube", { publishingJobId: job.id, ...body, privacy });
    res.status(202).json({ publishingJobId: job.id });
  } catch (e) { next(e); }
});

export default router;