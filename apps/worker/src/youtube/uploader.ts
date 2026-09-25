// FILE: apps/worker/src/youtube/uploader.ts
import { google } from "googleapis";
import crypto from "crypto";
import axios from "axios";
import fs from "fs"; import path from "path"; import os from "os";
import { prisma } from "@studio/db";

function tmpDir() {
  const dir = path.join(os.tmpdir(), "ai-studio");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function decrypt(payload: string) {
  const key = crypto.createHash("sha256").update(process.env.JWT_SECRET!).digest();
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12), tag = buf.subarray(12, 28), enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

export async function publishToYouTube(data: {
  publishingJobId: string; videoId: string; channelDbId: string; title: string; description: string; tags: string[]; privacy: "private" | "unlisted" | "public";
}) {
  const job = await prisma.publishingJob.update({ where: { id: data.publishingJobId }, data: { status: "uploading" } });
  try {
    const channel = await prisma.youTubeChannel.findUniqueOrThrow({ where: { id: data.channelDbId } });
    const client = new google.auth.OAuth2(process.env.YT_CLIENT_ID, process.env.YT_CLIENT_SECRET, process.env.YT_REDIRECT_URI);
    client.setCredentials({ access_token: decrypt(channel.accessTokenEnc), refresh_token: decrypt(channel.refreshTokenEnc) });

    const video = await prisma.video.findUniqueOrThrow({ where: { id: data.videoId } });
    const localPath = path.join(tmpDir(), `upload_${Date.now()}.mp4`);
    const { data: fileData } = await axios.get(video.finalUrl!, { responseType: "arraybuffer" });
    fs.writeFileSync(localPath, fileData);

    const yt = google.youtube({ version: "v3", auth: client });
    const res = await yt.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: { title: data.title, description: data.description, tags: data.tags },
        status: { privacyStatus: data.privacy === "public" ? "public" : (data.privacy || "private") },
      },
      media: { body: fs.createReadStream(localPath) },
    });

    await prisma.publishingJob.update({ where: { id: job.id }, data: { status: "uploaded", youtubeVideoId: res.data.id } });
  } catch (err: any) {
    await prisma.publishingJob.update({ where: { id: job.id }, data: { status: "failed", error: err.message } });
    throw err;
  }
}