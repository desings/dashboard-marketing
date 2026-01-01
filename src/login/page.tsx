"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@local.com");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr(j.error ?? "Error");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-xl border p-6">
        <h1 className="text-xl font-semibold">Acceso</h1>

        <input className="w-full rounded border p-2" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" />
        <input className="w-full rounded border p-2" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="Contraseña" type="password" />

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button className="w-full rounded bg-black text-white p-2">Entrar</button>
      </form>
    </div>
  );
}
