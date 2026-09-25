// FILE: apps/web/app/projects/page.tsx
"use client";
import Link from "next/link";
import useSWR from "swr";
import { api } from "../../lib/api";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function ProjectsPage() {
  const { data: projects } = useSWR("/projects", fetcher);

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">All Projects</h1>
      <div className="space-y-2">
        {(projects || []).map((p: any) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="block border rounded p-4 hover:bg-gray-50">
            <div className="flex justify-between">
              <span className="font-medium">{p.title}</span>
              <span className="text-sm text-gray-500 uppercase">{p.status}</span>
            </div>
          </Link>
        ))}
        {(!projects || projects.length === 0) && <p className="text-gray-500">No projects yet.</p>}
      </div>
    </div>
  );
}