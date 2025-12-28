"use client";

import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  function finish() {
    document.cookie = "ask_design_onboarded=1; path=/; samesite=lax";
    router.push("/input");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <div className="rounded-3xl border border-emerald-100 bg-white p-7 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">Ask Design</p>
          <h1 className="mt-1 text-2xl font-bold">はじめに（デモ）</h1>
          <p className="mt-2 text-sm text-neutral-600">
            目的と背景を整理して、スキル/ツールを選ぶだけでプロンプトを生成します。
          </p>

          <button onClick={finish} className="mt-6 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700">
            はじめる →
          </button>

          <button onClick={() => router.push("/input")} className="ml-3 mt-6 rounded-2xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold hover:bg-neutral-50">
            スキップ
          </button>
        </div>
      </div>
    </main>
  );
}
