// app/share/[token]/share-client.tsx
"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Template = {
  id: string;
  title: string;
  description: string | null;
  body_markdown: string;
  updated_at?: string | null;
};

type ApiRes =
  | { ok: true; template: Template }
  | { ok: false; error: string };

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
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

export default function ShareClient({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [tpl, setTpl] = useState<Template | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/share/get-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const json = (await res.json().catch(() => null)) as ApiRes | null;
        if (cancelled) return;

        if (!res.ok || !json || !json.ok) {
          setTpl(null);
          setError((json as any)?.error || "共有テンプレートを取得できませんでした。");
          return;
        }

        setTpl(json.template);
      } catch (e: any) {
        if (cancelled) return;
        setTpl(null);
        setError(e?.message || "共有テンプレートを取得できませんでした。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onCopy() {
    const text = (tpl?.body_markdown ?? "").trim();
    if (!text) return;
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="min-h-dvh bg-white">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm text-neutral-500">Ask Design</div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              Shared Template
            </h1>
          </div>

          <button
            type="button"
            onClick={onCopy}
            disabled={!tpl?.body_markdown}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-semibold",
              tpl?.body_markdown
                ? "border-neutral-200 text-neutral-800 hover:bg-neutral-50"
                : "border-neutral-100 text-neutral-400"
            )}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {loading && (
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
            読み込み中…
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {tpl && !loading && (
          <div className="mt-8 rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 px-5 py-4">
              <div className="text-sm font-semibold text-neutral-900">{tpl.title}</div>
              {tpl.description && (
                <div className="mt-1 text-xs text-neutral-500">{tpl.description}</div>
              )}
            </div>

            <div className="px-5 py-5">
              <div className="prose prose-neutral max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {tpl.body_markdown}
                </ReactMarkdown>
              </div>

              <div className="mt-6 rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">
                <span className="font-semibold">Token:</span> {token}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
