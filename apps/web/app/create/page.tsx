// FILE: apps/web/app/create/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

const STYLES = ["Documentary", "Explainer", "Vlog-style", "News-style", "Storytelling"];
const PRESENTERS = ["Professional Female", "Professional Male", "Casual Young", "Authoritative Senior"];

export default function CreateVideoPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    topicOrText: "",
    audience: "",
    durationSeconds: 420,
    language: "en",
    style: STYLES[0],
    presenterStyle: PRESENTERS[0],
    qualityPreset: "BALANCED",
    aspectRatio: "16:9",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setSubmitting(true);
    setError("");
    try {
      const { data } = await api.post("/generate", form);
      router.push(`/projects/${data.projectId}`);
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to start generation. Are you logged in?");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Create Video</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <textarea
        className="w-full h-40 p-3 rounded border"
        placeholder="Enter a topic, idea, article, notes, or full script... e.g. 'Explain why humans dream, 7 minutes'"
        value={form.topicOrText}
        onChange={(e) => setForm({ ...form, topicOrText: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-4">
        <input
          className="border p-2 rounded"
          placeholder="Target audience (optional)"
          value={form.audience}
          onChange={(e) => setForm({ ...form, audience: e.target.value })}
        />
        <input
          type="number"
          className="border p-2 rounded"
          placeholder="Duration (seconds)"
          value={form.durationSeconds}
          onChange={(e) => setForm({ ...form, durationSeconds: +e.target.value })}
        />
        <select
          className="border p-2 rounded"
          value={form.style}
          onChange={(e) => setForm({ ...form, style: e.target.value })}
        >
          {STYLES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          className="border p-2 rounded"
          value={form.presenterStyle}
          onChange={(e) => setForm({ ...form, presenterStyle: e.target.value })}
        >
          {PRESENTERS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          className="border p-2 rounded"
          value={form.qualityPreset}
          onChange={(e) => setForm({ ...form, qualityPreset: e.target.value })}
        >
          {["FAST", "BALANCED", "HIGH_QUALITY", "LOW_COST"].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          className="border p-2 rounded"
          value={form.aspectRatio}
          onChange={(e) => setForm({ ...form, aspectRatio: e.target.value })}
        >
          {["16:9", "9:16", "1:1", "4:5"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <button
        disabled={submitting || form.topicOrText.length < 3}
        onClick={generate}
        className="bg-blue-600 text-white px-6 py-3 rounded font-semibold disabled:opacity-50"
      >
        {submitting ? "Starting..." : "GENERATE VIDEO"}
      </button>
    </div>
  );
}