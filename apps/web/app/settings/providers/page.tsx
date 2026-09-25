// FILE: apps/web/app/settings/providers/page.tsx
"use client";
import { useState } from "react";
import { api } from "../../../lib/api";

const CATEGORIES = ["llm", "voice", "avatar", "image", "video", "music"];

export default function ProviderSettingsPage() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  async function save() {
    await api.post("/settings/providers", { category, provider, apiKey });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">Provider / API Settings</h1>
      <p className="text-sm text-gray-500">
        Keys are encrypted at rest and never exposed to the frontend. Leave blank to use free/mock defaults.
      </p>
      <select className="w-full border p-2 rounded" value={category} onChange={(e) => setCategory(e.target.value)}>
        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </select>
      <input className="w-full border p-2 rounded" placeholder="Provider name (e.g. groq, elevenlabs, did)" value={provider} onChange={(e) => setProvider(e.target.value)} />
      <input className="w-full border p-2 rounded" placeholder="API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" />
      <button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
      {saved && <p className="text-green-600 text-sm">Saved!</p>}
    </div>
  );
}