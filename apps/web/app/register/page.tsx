// FILE: apps/web/app/register/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function register() {
    try {
      const { data } = await api.post("/auth/register", form);
      localStorage.setItem("token", data.token);
      router.push("/");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Registration failed");
    }
  }

  return (
    <div className="max-w-sm mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">Register</h1>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input className="w-full border p-2 rounded" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <input className="w-full border p-2 rounded" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="password" className="w-full border p-2 rounded" placeholder="Password (min 8 chars)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <button onClick={register} className="w-full bg-blue-600 text-white py-2 rounded">Create Account</button>
      <a href="/login" className="block text-center text-sm text-blue-600">Already have an account? Log In</a>
    </div>
  );
}