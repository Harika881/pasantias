// FILE: apps/web/app/projects/[id]/page.tsx
"use client";
import useSWR from "swr";
import { api } from "../../../lib/api";

const PIPELINE_STAGES = [
  "content_analysis", "research", "script_generation", "retention_optimization",
  "scene_planning", "visual_generation", "voice_generation", "avatar_generation",
  "lip_sync", "captioning", "music_sfx", "composition", "quality_control",
  "thumbnail_metadata", "shorts_generation",
];

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function ProjectPage({ params }: { params: { id: string } }) {
  const { data: jobsData } = useSWR(`/jobs/project/${params.id}`, fetcher, { refreshInterval: 3000 });
  const { data: project } = useSWR(`/projects/${params.id}`, fetcher, { refreshInterval: 5000 });

  const jobByStage = new Map((jobsData?.jobs || []).map((j: any) => [j.stage, j]));
  const finalVideo = project?.videos?.[project.videos.length - 1];

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">{project?.title || "Loading..."}</h1>
      <p className="text-sm text-gray-500">Status: {project?.status}</p>

      <div className="space-y-2">
        {PIPELINE_STAGES.map((stage) => {
          const job: any = jobByStage.get(stage);
          const icon =
            job?.status === "completed" ? "✅" :
            job?.status === "failed" ? "❌" :
            job?.status === "running" ? "⏳" : "⬜";
          return (
            <div key={stage} className="flex justify-between border-b py-1">
              <span>{icon} {stage.replace(/_/g, " ")}</span>
              {job?.message && <span className="text-sm text-gray-500">{job.message}</span>}
            </div>
          );
        })}
      </div>

      {finalVideo?.finalUrl && (
        <div className="space-y-3">
          <video src={finalVideo.finalUrl} controls className="w-full rounded" />

          <div className="grid grid-cols-3 gap-3">
            {(finalVideo.thumbnailUrls || []).map((t: string, i: number) => (
              <img key={i} src={t} className="rounded border" alt={`thumbnail-${i}`} />
            ))}
          </div>

          <div>
            <h3 className="font-semibold">Title options</h3>
            <ul className="list-disc pl-5">
              {(finalVideo.titleOptions || []).map((t: string) => <li key={t}>{t}</li>)}
            </ul>
          </div>

          <PublishPanel
            projectId={params.id}
            videoId={finalVideo.id}
            defaultTitle={finalVideo.titleOptions?.[0]}
            defaultDescription={finalVideo.description}
            tags={finalVideo.tags}
          />
        </div>
      )}

      {project?.scripts?.[0]?.scenes && <SceneList scenes={project.scripts[0].scenes} />}
    </div>
  );
}

function SceneList({ scenes }: { scenes: any[] }) {
  async function regen(sceneId: string, field: string) {
    await api.post(`/scenes/${sceneId}/regenerate`, { field });
    alert(`Regeneration of "${field}" queued for scene.`);
  }

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-semibold">Scenes</h2>
      {scenes.map((s) => (
        <div key={s.id} className="border rounded p-3 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">
              Scene {s.sceneIndex} · {s.startTime}s–{s.endTime}s · {s.visualType}
            </p>
            <p>{s.narration}</p>
          </div>
          <div className="flex gap-2">
            <button className="text-xs bg-gray-100 px-2 py-1 rounded" onClick={() => regen(s.id, "voice")}>
              Regenerate voice
            </button>
            <button className="text-xs bg-gray-100 px-2 py-1 rounded" onClick={() => regen(s.id, "visual")}>
              Regenerate visual
            </button>
            <button className="text-xs bg-gray-100 px-2 py-1 rounded" onClick={() => regen(s.id, "avatar")}>
              Regenerate avatar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PublishPanel({ projectId, videoId, defaultTitle, defaultDescription, tags }: any) {
  async function publish(privacy: "private" | "unlisted" | "public") {
    const { data: channels } = await api.get("/youtube/channels");
    if (!channels[0]) {
      alert("Connect a YouTube channel first in Settings.");
      return;
    }
    await api.post("/youtube/publish", {
      videoId,
      channelDbId: channels[0].id,
      title: defaultTitle,
      description: defaultDescription,
      tags,
      privacy,
    });
    alert(`Publish job queued as ${privacy}.`);
  }

  return (
    <div className="flex gap-2">
      <button className="bg-gray-800 text-white px-4 py-2 rounded" onClick={() => publish("private")}>
        Upload as Private
      </button>
      <button className="bg-gray-600 text-white px-4 py-2 rounded" onClick={() => publish("unlisted")}>
        Upload as Unlisted
      </button>
      <button
        className="bg-red-600 text-white px-4 py-2 rounded"
        onClick={() => confirm("Publish PUBLICLY to YouTube?") && publish("public")}
      >
        Publish Public
      </button>
    </div>
  );
}