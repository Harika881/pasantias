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

function analyzeMedia(input: string): Promise<string> {
  const nullDevice = process.platform === "win32" ? "NUL" : "/dev/null";
  return new Promise((resolve, reject) => {
    execFile("ffmpeg", [
      "-hide_banner", "-i", resolveMediaInput(input),
      "-vf", "fps=1,signalstats,metadata=print",
      "-af", "volumedetect,silencedetect=noise=-45dB:d=0.5",
      "-f", "null", nullDevice,
    ], { maxBuffer: 1024 * 1024 }, (error, _stdout, stderr) => {
      if (error && !stderr.includes("video:") && !stderr.includes("Audio:")) {
        reject(new Error(stderr.trim() || error.message));
      } else {
        resolve(stderr);
      }
    });
  });
}

function totalDetectedDuration(log: string, pattern: RegExp) {
  return [...log.matchAll(pattern)].reduce((total, match) => total + Number(match[1]), 0);
}

export async function runQcChecks(videoUrl: string): Promise<QualityReport> {
  const issues: string[] = [];
  try {
    const metadata = await probe(videoUrl);
    const videoStream = metadata.streams?.find((stream: any) => stream.codec_type === "video");
    const audioStream = metadata.streams?.find((stream: any) => stream.codec_type === "audio");
    const duration = Number(metadata.format?.duration || videoStream?.duration || 0);

    if (!videoStream) issues.push("No video stream found");
    if (!audioStream) issues.push("No audio stream found");
    if (!Number.isFinite(duration) || duration <= 0) issues.push("Video has no positive duration");
    if (!videoStream?.width || !videoStream?.height) issues.push("Video has no valid resolution");

    if (videoStream && audioStream && Number.isFinite(duration) && duration > 0) {
      const analysis = await analyzeMedia(videoUrl);
      const luminanceSamples = [...analysis.matchAll(/lavfi\.signalstats\.YAVG=([\d.]+)/g)].map((match) => Number(match[1]));
      const meanLuminance = luminanceSamples.reduce((sum, value) => sum + value, 0) / Math.max(1, luminanceSamples.length);
      const darkSampleRatio = luminanceSamples.filter((value) => value < 55).length / Math.max(1, luminanceSamples.length);
      const silenceDuration = totalDetectedDuration(analysis, /silence_duration:\s*([\d.]+)/g);
      if (luminanceSamples.length > 0 && meanLuminance < 55 && darkSampleRatio >= 0.95) {
        issues.push("Video is almost entirely dark or visually static");
      }
      if (silenceDuration >= duration * 0.95) issues.push("Audio is almost entirely silent");
    }

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