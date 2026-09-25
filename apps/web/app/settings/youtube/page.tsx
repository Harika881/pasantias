// FILE: apps/web/app/settings/youtube/page.tsx
"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";

export default function YouTubeSettingsPage() {
  const [channels, setChannels] = useState<any[]>([]);

  useEffect(() => {
    api.get("/youtube/channels").then((r) => setChannels(r.data));
  }, []);

  async function connect() {
    const { data } = await api.get("/youtube/oauth/url");
    window.location.href = data.url;
  }

  return (
    <div className="max-w-xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">YouTube Settings</h1>
      <button onClick={connect} className="bg-red-600 text-white px-4 py-2 rounded">Connect YouTube Channel</button>
      <div className="space-y-2">
        {channels.map((c) => <div key={c.id} className="border rounded p-3">{c.channelTitle}</div>)}
      </div>
    </div>
  );
}