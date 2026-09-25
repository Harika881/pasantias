// FILE: apps/web/app/page.tsx
"use client";
import Link from "next/link";
import useSWR from "swr";
import { api } from "../lib/api";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function Dashboard() {
  const { data: projects } = useSWR("/projects", fetcher);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Link href="/create" className="inline-block bg-blue-600 text-white px-4 py-2 rounded">
        + Create New Video
      </Link>
      <div>
        <h2 className="text-xl font-semibold mt-6 mb-2">Recent Projects</h2>
        <div className="space-y-2">
          {(projects || []).map((p: any) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="block border rounded p-3 hover:bg-gray-50">
              <p className="font-medium">{p.title}</p>
              <p className="text-sm text-gray-500">{p.status}</p>
            </Link>
          ))}
          {(!projects || projects.length === 0) && <p className="text-gray-500">No projects yet. Create your first video!</p>}
        </div>
      </div>
    </div>
  );
}