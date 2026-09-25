// FILE: apps/web/app/settings/usage/page.tsx
"use client";
import useSWR from "swr";
import { api } from "../../../lib/api";

const fetcher = (url: string) => api.get(url).then((r) => r.data);

export default function UsagePage() {
  const { data } = useSWR("/usage", fetcher);

  return (
    <div className="max-w-xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">Usage / Cost Tracking</h1>
      <p className="text-lg">Estimated total cost: <strong>${(data?.totalUsd || 0).toFixed(2)}</strong></p>
      <div>
        {Object.entries(data?.byCategory || {}).map(([cat, cost]: any) => (
          <div key={cat} className="flex justify-between border-b py-1">
            <span>{cat}</span><span>${cost.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}