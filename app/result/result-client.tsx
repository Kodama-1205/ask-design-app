// app/result/result-client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchJson } from "@/lib/api/fetchJson";
import { apiError, userMessageByCode, type ApiErrorPayload } from "@/lib/api/errors";

type TargetAI = "chatgpt" | "gemini" | "claude";

type NormalizedResult = {
  generated_prompt: string;
  explanation: string;
  meta?: {
    workflow_run_id?: string | null;
    task_id?: string | null;
    status?: string | null;
  };
  raw?: any;
};

type RunWorkflowOk = {
  ok: true;
  generated_prompt: string;
  explanation: string;
  meta?: NormalizedResult["meta"];
  raw?: any;
};

type FormatOk = {
  ok: true;
  target: TargetAI;
  formatted_prompt: string;
};

type ShareCreateOk = {
  ok: true;
  token: string;
  url: string;
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

function copyToClipboard(text: string) {
  if (!text) return;
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
}

function targetLabel(t: TargetAI) {
  if (t === "chatgpt") return "ChatGPT";
  if (t === "gemini") return "Gemini";
  return "Claude";
}

function normalizeError(e: ApiErrorPayload) {
  return {
    title: `${e.status || ""} ${e.code}`.trim(),
    message: e.message || userMessageByCode(e.code),
    detail: e.detail ?? null,
    hint: e.hint ?? null,
  };
}

function ensureInputsObject(v: any): Record<string, any> | null {
  if (v && typeof v === "object" && !Array.isArray(v)) {
    if (v.inputs && typeof v.inputs === "object") return v.inputs;
    return v;
  }
  return null;
}

function SkeletonLine({ w = "w-full" }: { w?: string }) {
  return <div className={cn("h-3 rounded bg-neutral-200 animate-pulse", w)} />;
}

function SkeletonBlock({ lines = 6 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-100 px-5 py-4">
        <div className="h-4 w-28 rounded bg-neutral-200 animate-pulse" />
        <div className="mt-2 h-3 w-44 rounded bg-neutral-200 animate-pulse" />
      </div>
      <div className="px-5 py-5 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine
            key={i}
            w={i % 4 === 0 ? "w-5/6" : i % 4 === 1 ? "w-3/4" : i % 4 === 2 ? "w-2/3" : "w-full"}
          />
        ))}
      </div>
    </div>
  );
}

export default function ResultClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [formatting, setFormatting] = useState(false);
  const [sharing, setSharing] = useState(false);

  const [err, setErr] = useState<ApiErrorPayload | null>(null);
  const [result, setResult] = useState<NormalizedResult | null>(null);

  const [target, setTarget] = useState<TargetAI>("chatgpt");
  const [formatted, setFormatted] = useState("");
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedFormatted, setCopiedFormatted] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const title = useMemo(() => {
    const t = sp.get("title");
    return (t ?? "").trim() || "Ask Design";
  }, [sp]);

  useEffect(() => {
    const stored = safeJsonParse<NormalizedResult>(localStorage.getItem(LS_RESULT_KEY));
    if (stored?.generated_prompt || stored?.explanation) setResult(stored);
    setLoading(false);
  }, []);

  useEffect(() => {
    const gp = (result?.generated_prompt ?? "").trim();
    if (!gp) {
      setFormatted("");
      return;
    }

    let cancelled = false;

    async function run() {
      setFormatting(true);
      setErr(null);

      const res = await fetchJson<FormatOk>("/api/prompt/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target,
          generated_prompt: result?.generated_prompt ?? "",
          explanation: result?.explanation ?? "",
          title,
        }),
      });

      if (cancelled) return;

      if ((res as any)?.ok === false) {
        setFormatted("");
        setErr(res as ApiErrorPayload);
        setFormatting(false);
        return;
      }

      setFormatted((res as FormatOk).formatted_prompt || "");
      setFormatting(false);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [target, result?.generated_prompt, result?.explanation, title]);

  const hasResult = !!(result?.generated_prompt || result?.explanation);

  async function onCopyPrompt() {
    const text = (result?.generated_prompt ?? "").trim();
    if (!text) return;
    await copyToClipboard(text);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 1200);
  }

  async function onCopyFormatted() {
    const text = (formatted ?? "").trim();
    if (!text) return;
    await copyToClipboard(text);
    setCopiedFormatted(true);
    setTimeout(() => setCopiedFormatted(false), 1200);
  }

  async function onShare() {
    if (!result?.generated_prompt?.trim()) return;

    setSharing(true);
    setErr(null);

    const res = await fetchJson<ShareCreateOk>("/api/share/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        generated_prompt: result.generated_prompt,
        explanation: result.explanation,
      }),
    });

    if ((res as any)?.ok === false) {
      setErr(res as ApiErrorPayload);
      setSharing(false);
      return;
    }

    const ok = res as ShareCreateOk;
    const url = `${window.location.origin}${ok.url}`;
    await copyToClipboard(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 1400);

    setSharing(false);
    router.push(ok.url);
  }

  async function onRefineRegenerate() {
    setRunning(true);
    setErr(null);

    const raw = safeJsonParse<any>(localStorage.getItem(LS_INPUTS_KEY));
    const inputs = ensureInputsObject(raw);

    if (!inputs) {
      setErr(apiError(400, "BAD_REQUEST", "入力が見つかりません。/input からやり直してください。"));
      setRunning(false);
      return;
    }

    const payload = {
      inputs: {
        ...inputs,
        refine: true,
        previous_prompt: result?.generated_prompt ?? "",
        previous_explanation: result?.explanation ?? "",
      },
      user: "ask-design-web",
    };

    const res = await fetchJson<RunWorkflowOk>("/api/dify/run-workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if ((res as any)?.ok === false) {
      setErr(res as ApiErrorPayload);
      setRunning(false);
      return;
    }

    const ok = res as RunWorkflowOk;

    const next: NormalizedResult = {
      generated_prompt: ok.generated_prompt || "",
      explanation: ok.explanation || "",
      meta: ok.meta,
      raw: ok.raw,
    };

    setResult(next);
    localStorage.setItem(LS_RESULT_KEY, JSON.stringify(next));
    setRunning(false);
  }

  function goInput() {
    router.push("/input");
  }
  function goTemplates() {
    router.push("/templates");
  }
  function loadSample() {
    const sample: NormalizedResult = {
      generated_prompt:
        "あなたはプロンプトエンジニアです。以下の情報から、LLMに渡す最適なプロンプトを作成してください。\n\n- Goal: …\n- Context: …\n- Skill level: …\n- Tools: …\n\n出力は Markdown で。",
      explanation:
        "Goal/Context/Skill/Tools を分離し、曖昧点は質問→仮定の順で解決する構造にしています。外部AIへコピペしやすいように短い見出しで整理しています。",
      meta: { status: "sample", workflow_run_id: null, task_id: null },
    };
    setResult(sample);
    localStorage.setItem(LS_RESULT_KEY, JSON.stringify(sample));
  }

  const errView = err ? normalizeError(err) : null;

  return (
    <div className="min-h-dvh bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm text-neutral-500">{title}</div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">/result</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={goInput}
              className="rounded-xl border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              /input に戻る
            </button>

            <button
              type="button"
              onClick={onRefineRegenerate}
              disabled={running || !hasResult}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-semibold text-white",
                running || !hasResult ? "bg-neutral-300" : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {running ? "再生成中…" : "詳細化して再生成"}
            </button>

            <button
              type="button"
              onClick={onShare}
              disabled={sharing || !result?.generated_prompt}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-semibold",
                sharing || !result?.generated_prompt
                  ? "border border-neutral-100 text-neutral-400"
                  : "border border-neutral-200 text-neutral-800 hover:bg-neutral-50"
              )}
            >
              {sharing ? "共有中…" : copiedShare ? "URL copied" : "共有リンク作成"}
            </button>
          </div>
        </div>

        {errView && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="text-sm font-semibold text-red-800">{errView.title}</div>
            <div className="mt-1 text-sm text-red-700">{errView.message}</div>
          </div>
        )}

        {!loading && !hasResult && (
          <div className="mt-8 rounded-2xl border border-neutral-200 p-6">
            <div className="text-base font-semibold text-neutral-900">結果がありません</div>
            <div className="mt-2 text-sm text-neutral-600">
              /input で入力して生成してください（直近の結果は自動保存されます）。
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={goInput}
                className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                /input へ
              </button>

              <button
                onClick={goTemplates}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                /templates へ
              </button>

              <button
                onClick={loadSample}
                className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                サンプル表示
              </button>
            </div>
          </div>
        )}

        {(running || (loading && !hasResult)) && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SkeletonBlock lines={10} />
            <SkeletonBlock lines={8} />
          </div>
        )}

        {hasResult && (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
                <div>
                  <div className="text-sm font-semibold text-neutral-900">生成結果</div>
                  <div className="mt-0.5 text-xs text-neutral-500">generated_prompt / explanation（Markdown）</div>
                </div>

                <button
                  type="button"
                  onClick={onCopyPrompt}
                  disabled={!result?.generated_prompt}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-semibold",
                    result?.generated_prompt
                      ? "border-neutral-200 text-neutral-800 hover:bg-neutral-50"
                      : "border-neutral-100 text-neutral-400"
                  )}
                >
                  {copiedPrompt ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="px-5 py-5">
                <div className="text-xs font-semibold text-neutral-500">generated_prompt</div>
                <div className="prose prose-neutral mt-2 max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result?.generated_prompt || ""}
                  </ReactMarkdown>
                </div>

                <div className="mt-6 text-xs font-semibold text-neutral-500">explanation</div>
                <div className="prose prose-neutral mt-2 max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result?.explanation || ""}
                  </ReactMarkdown>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
              <div className="border-b border-neutral-100 px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">出力先AI最適化</div>
                    <div className="mt-0.5 text-xs text-neutral-500">ChatGPT / Gemini / Claude に合わせて整形</div>
                  </div>

                  <button
                    type="button"
                    onClick={onCopyFormatted}
                    disabled={!formatted || formatting}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm font-semibold",
                      formatted && !formatting
                        ? "border-neutral-200 text-neutral-800 hover:bg-neutral-50"
                        : "border-neutral-100 text-neutral-400"
                    )}
                  >
                    {copiedFormatted ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="mt-4 flex w-full rounded-2xl bg-neutral-100 p-1">
                  {(["chatgpt", "gemini", "claude"] as TargetAI[]).map((t) => {
                    const active = target === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTarget(t)}
                        className={cn(
                          "flex-1 rounded-2xl px-3 py-2 text-sm font-semibold transition",
                          active ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-800"
                        )}
                      >
                        {targetLabel(t)}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-5 py-5">
                {formatting ? (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                    <div className="mb-3 h-3 w-28 rounded bg-neutral-200 animate-pulse" />
                    <div className="space-y-3">
                      <SkeletonLine w="w-5/6" />
                      <SkeletonLine w="w-3/4" />
                      <SkeletonLine w="w-full" />
                      <SkeletonLine w="w-2/3" />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50">
                    <div className="border-b border-neutral-200 px-4 py-3 text-xs font-semibold text-neutral-600">
                      formatted_prompt
                    </div>
                    <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-words px-4 py-4 text-sm text-neutral-900">
{formatted ?? ""}
                    </pre>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
