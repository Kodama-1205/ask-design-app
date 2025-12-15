"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const TOOL_OPTIONS = ["Excel", "Slack", "Gmail", "ChatGPT", "その他"] as const;
type Tool = (typeof TOOL_OPTIONS)[number];

export default function InputPage() {
  const router = useRouter();

  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [skillLevel, setSkillLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [tools, setTools] = useState<Tool[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canGenerate = useMemo(() => {
    return goal.trim().length > 0 && context.trim().length > 0;
  }, [goal, context]);

  const toggleTool = (t: Tool) => {
    setTools((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const onGenerate = async () => {
    setError(null);

    if (!canGenerate) {
      setError("目的と現状を入力してください。");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal,
          context,
          skill_level: skillLevel,
          tools,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`API error: ${response.status} ${text}`);
      }

      const data = await response.json();

      // result画面に渡す（URLに乗せず sessionStorage を使う）
      sessionStorage.setItem("askdesign_generated_prompt", String(data.generated_prompt ?? ""));
      sessionStorage.setItem("askdesign_explanation", String(data.explanation ?? ""));

      router.push("/result");
    } catch (e: any) {
      console.error("Generate error:", e);
      setError("生成に失敗しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-2xl px-6 py-10 space-y-6">
        <h1 className="text-2xl font-bold text-green-700">入力フォーム</h1>

        <div className="space-y-2">
          <label className="font-semibold">目的</label>
          <textarea
            className="w-full border rounded-lg p-3"
            rows={3}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="例：売上レポートを自動化したい"
          />
        </div>

        <div className="space-y-2">
          <label className="font-semibold">現状</label>
          <textarea
            className="w-full border rounded-lg p-3"
            rows={4}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="例：毎週Excel集計してSlackに送っているが時間がかかる"
          />
        </div>

        <div className="space-y-2">
          <label className="font-semibold">スキルレベル</label>
          <div className="flex gap-4">
            {[
              { v: "beginner", label: "初心者" },
              { v: "intermediate", label: "中級" },
              { v: "advanced", label: "上級" },
            ].map((x) => (
              <label key={x.v} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="skill"
                  value={x.v}
                  checked={skillLevel === x.v}
                  onChange={() => setSkillLevel(x.v as any)}
                />
                {x.label}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-semibold">使用ツール</label>
          <div className="flex flex-wrap gap-3">
            {TOOL_OPTIONS.map((t) => (
              <label key={t} className="flex items-center gap-2 border rounded-full px-3 py-1">
                <input
                  type="checkbox"
                  checked={tools.includes(t)}
                  onChange={() => toggleTool(t)}
                />
                {t}
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="border border-red-300 bg-red-50 text-red-700 rounded-lg p-3">
            {error}
          </div>
        )}

        <button
          onClick={onGenerate}
          disabled={loading}
          className="w-full bg-green-600 text-white rounded-lg py-3 font-semibold disabled:opacity-60"
        >
          {loading ? "生成中…" : "生成する"}
        </button>
      </div>
    </main>
  );
}
