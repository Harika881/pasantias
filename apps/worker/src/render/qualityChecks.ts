// FILE: apps/worker/src/render/thumbnail.ts
import { execFile } from "child_process";
import fs from "fs";
import path from "path";

interface QualityReport {
  passed: boolean;
  issues: string[];
  durationSec?: number;
  width?: number;
  height?: number;
}

function resolveMediaInput(input: string) {
  if (fs.existsSync(input)) return input;
  try {
    const parsed = new URL(input);
    if (parsed.pathname.startsWith("/uploads/")) {
      const localPath = path.resolve(__dirname, "../../../..", "uploads", decodeURIComponent(parsed.pathname.slice("/uploads/".length)));
      if (fs.existsSync(localPath)) return localPath;
    }
  } catch {
    // Let ffprobe report invalid non-URL inputs.
  }
  return input;
}

function probe(input: string): Promise<any> {
  return new Promise((resolve, reject) => {
    execFile("ffprobe", [
      "-v", "error", "-show_streams", "-show_format", "-of", "json", resolveMediaInput(input),
    ], (error, stdout, stderr) => {
      if (error) reject(new Error(stderr.trim() || error.message));
      else resolve(JSON.parse(stdout));
    });
  });
}

export async function runQcChecks(videoUrl: string): Promise<QualityReport> {
  const issues: string[] = [];
  try {
    const metadata = await probe(videoUrl);
    const videoStream = metadata.streams?.find((stream: any) => stream.codec_type === "video");
    const duration = Number(metadata.format?.duration || videoStream?.duration || 0);

    if (!videoStream) issues.push("No video stream found");
    if (!Number.isFinite(duration) || duration <= 0) issues.push("Video has no positive duration");
    if (!videoStream?.width || !videoStream?.height) issues.push("Video has no valid resolution");

    return {
      passed: issues.length === 0,
      issues,
      durationSec: duration,
      width: videoStream?.width,
      height: videoStream?.height,
    };
  } catch (error: any) {
    return { passed: false, issues: [`Unable to inspect video: ${error?.message || "unknown error"}`] };
  }
}