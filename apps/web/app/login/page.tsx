// FILE: apps/web/app/login/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function login() {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      router.push("/");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Login failed");
    }
  }

  return (
    <div className="max-w-sm mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">Log In</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input className="w-full border p-2 rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" className="w-full border p-2 rounded" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={login} className="w-full bg-blue-600 text-white py-2 rounded">Log In</button>
      <a href="/register" className="block text-center text-sm text-blue-600">Need an account? Register</a>
    </div>
  );
}