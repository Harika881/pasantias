// FILE: apps/worker/src/render/ffmpegEngine.ts
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import os from "os";
import { logger } from "@studio/shared";

function tmpDir() {
  const dir = path.join(os.tmpdir(), "ai-studio");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

interface SceneWithAssets {
  id: string; sceneIndex: number; startTime: number; endTime: number; narration: string;
  visualType: string; onScreenText: string | null; camera: string | null; transition: string | null;
  assets: { type: string; url: string }[]; audio: { durationSec: number } | null;
}

const RESOLUTIONS: Record<string, string> = { "16:9": "1920x1080", "9:16": "1080x1920", "1:1": "1080x1080", "4:5": "1080x1350" };

function resolveMediaInput(input: string) {
  if (fs.existsSync(input)) return input;
  try {
    const parsed = new URL(input);
    if (parsed.pathname.startsWith("/uploads/")) {
      const localPath = path.resolve(__dirname, "../../../..", "uploads", decodeURIComponent(parsed.pathname.slice("/uploads/".length)));
      if (fs.existsSync(localPath)) return localPath;
    }
  } catch {
    // Keep non-URL inputs unchanged for ffmpeg to handle.
  }
  return input;
}

export async function composeFinalVideo(params: {
  projectId: string; scenes: SceneWithAssets[]; musicUrl?: string; aspectRatio: "16:9" | "9:16" | "1:1" | "4:5";
}): Promise<string> {
  const res = RESOLUTIONS[params.aspectRatio] || RESOLUTIONS["16:9"];
  const [w, h] = res.split("x").map(Number);
  const workDir = path.join(tmpDir(), `render_${params.projectId}_${Date.now()}`);
  fs.mkdirSync(workDir, { recursive: true });

  const sceneClipPaths: string[] = [];
  for (const scene of params.scenes) {
    const clipPath = await buildSceneClip(scene, workDir, w, h);
    sceneClipPaths.push(clipPath);
  }

  const concatListPath = path.join(workDir, "concat.txt");
  fs.writeFileSync(concatListPath, sceneClipPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n"));

  const videoOnlyPath = path.join(workDir, "video_concat.mp4");
  await runFfmpeg((cmd) => cmd.input(concatListPath).inputOptions(["-f", "concat", "-safe", "0"]).outputOptions(["-c", "copy"]).output(videoOnlyPath));

  const finalPath = path.join(workDir, "final.mp4");
  if (params.musicUrl) {
    await runFfmpeg((cmd) =>
      cmd
        .input(videoOnlyPath)
        .input(resolveMediaInput(params.musicUrl!))
        .complexFilter([
          "[1:a]volume=0.18[music]",
          "[0:a][music]sidechaincompress=threshold=0.05:ratio=8:attack=5:release=300[music_ducked]",
          "[0:a][music_ducked]amix=inputs=2:duration=first:dropout_transition=2[aout]",
        ])
        .outputOptions(["-map", "0:v", "-map", "[aout]", "-c:v", "libx264", "-c:a", "aac", "-shortest"])
        .output(finalPath)
    );
  } else {
    fs.copyFileSync(videoOnlyPath, finalPath);
  }

  logger.info({ finalPath }, "Final video rendered");
  return finalPath;
}

async function buildSceneClip(scene: SceneWithAssets, workDir: string, w: number, h: number) {
  const outPath = path.join(workDir, `scene_${scene.sceneIndex}.mp4`);
  const duration = Math.max(1, scene.endTime - scene.startTime);
  const videoAsset = scene.assets.find((a) => a.type === "video");
  const imageAsset = scene.assets.find((a) => a.type === "image");
  const audioAsset = scene.assets.find((a) => a.type === "audio");
  const sfxAsset = scene.assets.find((a) => a.type === "sfx");

  const camera = cameraFilter(scene.camera, duration, w, h);

  await runFfmpeg((cmd) => {
    if (videoAsset) {
      cmd.input(resolveMediaInput(videoAsset.url));
    } else if (imageAsset) {
      cmd.input(resolveMediaInput(imageAsset.url)).inputOptions(["-loop", "1"]);
    } else {
      cmd.input(`color=c=0x111827:s=${w}x${h}:d=${duration}`).inputOptions(["-f", "lavfi"]);
    }
    if (audioAsset) cmd.input(resolveMediaInput(audioAsset.url));

      const vf = `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}${camera}`;
    cmd.outputOptions(["-t", String(duration), "-vf", vf, "-c:v", "libx264", "-pix_fmt", "yuv420p"]);
    if (audioAsset) cmd.outputOptions(["-map", "0:v", "-map", "1:a", "-c:a", "aac", "-shortest"]);
    else cmd.outputOptions(["-an"]);
    cmd.output(outPath);
  });

  if (sfxAsset) return mixSfxIntoClip(outPath, resolveMediaInput(sfxAsset.url), workDir, scene.sceneIndex);
  return outPath;
}

function cameraFilter(camera: string | null, duration: number, w: number, h: number) {
  const frames = Math.round(duration * 25);
  switch (camera) {
    case "slow_zoom_in": return `,zoompan=z='min(zoom+0.0006,1.12)':d=${frames}:s=${w}x${h}`;
    case "slow_zoom_out": return `,zoompan=z='if(eq(on,1),1.12,max(1.0,zoom-0.0006))':d=${frames}:s=${w}x${h}`;
    default: return "";
  }
}

async function mixSfxIntoClip(clipPath: string, sfxUrl: string, workDir: string, idx: number) {
  const outPath = path.join(workDir, `scene_${idx}_sfx.mp4`);
  await runFfmpeg((cmd) =>
    cmd.input(clipPath).input(resolveMediaInput(sfxUrl))
      .complexFilter(["[1:a]volume=0.35[sfx]", "[0:a][sfx]amix=inputs=2:duration=first[aout]"])
      .outputOptions(["-map", "0:v", "-map", "[aout]", "-c:v", "copy", "-c:a", "aac"])
      .output(outPath)
  );
  return outPath;
}

export async function extractShort(sourceUrl: string, startSec: number, endSec: number) {
  const outPath = path.join(tmpDir(), `short_${Date.now()}.mp4`);
  await runFfmpeg((cmd) =>
    cmd.input(resolveMediaInput(sourceUrl)).inputOptions(["-ss", String(startSec), "-to", String(endSec)])
      .videoFilters("scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920")
      .outputOptions(["-c:v", "libx264", "-c:a", "aac"])
      .output(outPath)
  );
  return outPath;
}

function runFfmpeg(build: (cmd: ffmpeg.FfmpegCommand) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd = ffmpeg();
    build(cmd);
    cmd.on("end", () => resolve()).on("error", (err) => reject(err)).run();
  });
}