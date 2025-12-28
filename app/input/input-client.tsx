// app/input/input-client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchJson } from "@/lib/api/fetchJson";
import { apiError, userMessageByCode, type ApiErrorPayload } from "@/lib/api/errors";

type RunWorkflowOk = {
  ok: true;
  generated_prompt: string;
  explanation: string;
  meta?: {
    workflow_run_id?: string | null;
    task_id?: string | null;
    status?: string | null;
  };
  raw?: any;
};

type Template = {
  id: string;
  title: string;
  description?: string | null;
  body_markdown: string;
};

const LS_INPUTS_KEY = "ask_design_inputs";
const LS_RESULT_KEY = "ask_design_last_result";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function normalizeError(e: ApiErrorPayload) {
  return {
    title: `${e.status || ""} ${e.code}`.trim(),
    message: e.message || userMessageByCode(e.code),
    detail: e.detail ?? null,
    hint: e.hint ?? null,
  };
}

function splitTokens(s: string) {
  return (s ?? "")
    .split(/[,\n]/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function uniq(xs: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    const k = x.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

export default function InputClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const templateId = useMemo(() => (sp.get("templateId") ?? "").trim(), [sp]);

  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [skillLevel, setSkillLevel] = useState("");

  const presetTools = useMemo(
    () => [
      "ChatGPT",
      "Gemini",
      "Claude",
      "Dify",
      "Next.js",
      "Supabase",
      "Vercel",
      "Notion",
      "Google Sheets",
      "Slack",
      "Python",
      "SQL",
    ],
    []
  );

  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [customToolsText, setCustomToolsText] = useState("");

  const [err, setErr] = useState<ApiErrorPayload | null>(null);

  const toolsString = useMemo(() => {
    const custom = splitTokens(customToolsText);
    const merged = uniq([...selectedTools, ...custom]);
    return merged.join(", ");
  }, [selectedTools, customToolsText]);

  // localStorage から復元
  useEffect(() => {
    const stored = safeJsonParse<any>(localStorage.getItem(LS_INPUTS_KEY));
    if (stored && typeof stored === "object") {
      const v = stored.inputs && typeof stored.inputs === "object" ? stored.inputs : stored;

      setGoal(String(v.goal ?? ""));
      setContext(String(v.context ?? ""));
      setSkillLevel(String(v.skill_level ?? v.skillLevel ?? ""));

      // tools は Dify 互換のため string
      const toolsStr = String(v.tools ?? "");
      const tokens = splitTokens(toolsStr);

      const presetSet = new Set(presetTools.map((x) => x.toLowerCase()));
      const sel = tokens.filter((t) => presetSet.has(t.toLowerCase()));
      const custom = tokens.filter((t) => !presetSet.has(t.toLowerCase()));

      setSelectedTools(uniq(sel));
      setCustomToolsText(custom.join(", "));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // inputs を常に保存（Dify互換：toolsはstring）
  useEffect(() => {
    const payload = {
      goal,
      context,
      skill_level: skillLevel,
      tools: toolsString, // ✅ string only
    };
    localStorage.setItem(LS_INPUTS_KEY, JSON.stringify(payload));
  }, [goal, context, skillLevel, toolsString]);

  // templateId があればテンプレ読み込み（存在しなくても入力は止めない）
  useEffect(() => {
    if (!templateId) return;

    let cancelled = false;

    async function run() {
      setLoadingTemplate(true);
      try {
        const res = await fetchJson<{ ok: true; template: Template } | ApiErrorPayload>("/api/templates/get", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template_id: templateId }),
        });

        if (cancelled) return;
        if ((res as any)?.ok === false) return;

        const ok = res as any;
        const md = String(ok.template?.body_markdown ?? "");
        if (!goal && md) setGoal(md);
      } finally {
        if (!cancelled) setLoadingTemplate(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  function toggleTool(t: string) {
    setSelectedTools((prev) => {
      const has = prev.some((x) => x.toLowerCase() === t.toLowerCase());
      if (has) return prev.filter((x) => x.toLowerCase() !== t.toLowerCase());
      return uniq([...prev, t]);
    });
  }

  async function onGenerate() {
    setSubmitting(true);
    setErr(null);

    const inputs = {
      goal: goal.trim(),
      context: context.trim(),
      skill_level: skillLevel.trim(),
      tools: toolsString.trim(), // ✅ Dify側 text-input 互換
    };

    if (!inputs.goal) {
      setErr(apiError(400, "BAD_REQUEST", "Goal は必須です。"));
      setSubmitting(false);
      return;
    }

    localStorage.setItem(LS_INPUTS_KEY, JSON.stringify(inputs));

    const res = await fetchJson<RunWorkflowOk>("/api/dify/run-workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs, user: "ask-design-web" }),
    });

    if ((res as any)?.ok === false) {
      setErr(res as ApiErrorPayload);
      setSubmitting(false);
      return;
    }

    const ok = res as RunWorkflowOk;

    const next = {
      generated_prompt: ok.generated_prompt || "",
      explanation: ok.explanation || "",
      meta: ok.meta ?? null,
      raw: ok.raw ?? null,
    };

    localStorage.setItem(LS_RESULT_KEY, JSON.stringify(next));
    setSubmitting(false);
    router.push("/result");
  }

  const errView = err ? normalizeError(err) : null;

  return (
    <div className="min-h-dvh bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm text-neutral-500">Ask Design</div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">/input</h1>
            <div className="mt-1 text-sm text-neutral-600">Goal / Context / Skill level / Tools を入力して生成します。</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/templates")}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              /templates
            </button>

            <button
              type="button"
              onClick={onGenerate}
              disabled={submitting}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold text-white",
                submitting ? "bg-neutral-300" : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {submitting ? "生成中…" : "生成する"}
            </button>
          </div>
        </div>

        {/* Banner */}
        {loadingTemplate && (
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
            テンプレ読み込み中…
          </div>
        )}

        {errView && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-red-800">{errView.title}</div>
                <div className="mt-1 text-sm text-red-700">{errView.message}</div>
                {errView.hint && <div className="mt-2 text-xs text-red-700">ヒント：{errView.hint}</div>}
                {errView.detail && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-semibold text-red-800">詳細（開く）</summary>
                    <pre className="mt-2 max-h-[260px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-red-200 bg-white p-3 text-xs text-red-900">
{errView.detail}
                    </pre>
                  </details>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setErr(null)}
                  className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-800 hover:bg-red-50"
                >
                  閉じる
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/result")}
                  className="rounded-xl bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
                >
                  /result
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Form */}
          <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 px-5 py-4">
              <div className="text-sm font-semibold text-neutral-900">入力</div>
              <div className="mt-0.5 text-xs text-neutral-500">生成に必要な情報を整理して入力します。</div>
            </div>

            <div className="px-5 py-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-neutral-900">Goal</label>
                <div className="mt-1 text-xs text-neutral-500">目的（必須）</div>
                <textarea
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  rows={6}
                  className="mt-3 w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="例：週次レポート生成を自動化したい"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900">Context</label>
                <div className="mt-1 text-xs text-neutral-500">背景・状況</div>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={6}
                  className="mt-3 w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="例：社内の営業レポートを毎週集計してSlackに投稿したい。"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900">Skill level</label>
                <div className="mt-1 text-xs text-neutral-500">想定スキル（初心者/中級/上級など）</div>
                <input
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="mt-3 w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="例：初心者"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900">Tools</label>
                <div className="mt-1 text-xs text-neutral-500">
                  クリックで選択（＋自由入力）。送信は Dify 互換のため <span className="font-semibold">文字列</span> です。
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {presetTools.map((t) => {
                    const active = selectedTools.some((x) => x.toLowerCase() === t.toLowerCase());
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTool(t)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                          active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                        )}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  value={customToolsText}
                  onChange={(e) => setCustomToolsText(e.target.value)}
                  rows={3}
                  className="mt-3 w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-900 outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="自由入力（例：Google Drive, QuickChart）"
                />

                <div className="mt-2 text-xs text-neutral-500">
                  送信される tools：<span className="font-semibold text-neutral-800">{toolsString || "（未入力）"}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Right: Preview */}
          <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 px-5 py-4">
              <div className="text-sm font-semibold text-neutral-900">プレビュー</div>
              <div className="mt-0.5 text-xs text-neutral-500">この内容でプロンプト生成します（Markdown）。</div>
            </div>

            <div className="px-5 py-5">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <div className="text-xs font-semibold text-neutral-600">入力まとめ</div>
                <div className="mt-3 space-y-3 text-sm text-neutral-900">
                  <div>
                    <div className="text-xs font-semibold text-neutral-500">Goal</div>
                    <div className="mt-1 whitespace-pre-wrap">{goal || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-500">Context</div>
                    <div className="mt-1 whitespace-pre-wrap">{context || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-500">Skill level</div>
                    <div className="mt-1 whitespace-pre-wrap">{skillLevel || "—"}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-500">Tools</div>
                    <div className="mt-1 whitespace-pre-wrap">{toolsString || "—"}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/result")}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                >
                  /result
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/templates")}
                  className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
                >
                  /templates
                </button>
              </div>

              <div className="mt-3 text-xs text-neutral-500">
                ※ 入力は localStorage（{LS_INPUTS_KEY}）に自動保存されます。
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
