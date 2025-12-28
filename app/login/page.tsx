"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "ログイン失敗");
      router.push("/");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "ログイン失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="mx-auto max-w-md px-6 py-14">
        <div className="rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">Ask Design</p>
          <h1 className="mt-1 text-2xl font-bold">ログイン</h1>

          {err && <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

          <form onSubmit={onLogin} className="mt-6 space-y-4">
            <input className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm" placeholder="email"
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm" placeholder="password(6+)" type="password"
              value={password} onChange={(e) => setPassword(e.target.value)} />

            <button disabled={busy} className="w-full rounded-2xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
              {busy ? "処理中..." : "ログイン"}
            </button>

            <a className="block text-center text-sm text-emerald-700 hover:underline" href="/register">
              新規登録はこちら
            </a>
          </form>
        </div>
      </div>
    </main>
  );
}
