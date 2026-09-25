// FILE: apps/worker/src/services/storage.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const USE_LOCAL = process.env.STORAGE_MODE !== "s3";
const LOCAL_DIR = path.resolve(__dirname, "../../../..", "uploads");

export async function uploadLocalFile(localPath: string, prefix: string) {
  if (USE_LOCAL) {
    const destDir = path.join(LOCAL_DIR, prefix);
    fs.mkdirSync(destDir, { recursive: true });
    const filename = `${Date.now()}_${path.basename(localPath)}`;
    const destPath = path.join(destDir, filename);
    fs.copyFileSync(localPath, destPath);
    const url = `${process.env.LOCAL_STORAGE_BASE_URL || "http://localhost:4000/uploads"}/${prefix}/${filename}`;
    return { key: `${prefix}/${filename}`, url };
  }

  const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT, region: process.env.S3_REGION,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY!, secretAccessKey: process.env.S3_SECRET_KEY! },
  });
  const key = `${prefix}/${Date.now()}_${path.basename(localPath)}`;
  const body = fs.readFileSync(localPath);
  await s3.send(new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, Body: body }));
  const url = `${process.env.S3_PUBLIC_BASE_URL}/${key}`;
  return { key, url };
}