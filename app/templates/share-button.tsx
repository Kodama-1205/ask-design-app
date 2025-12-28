// app/templates/share-button.tsx
"use client";

import { useState } from "react";

type ApiRes =
  | { ok: true; token: string; share_url: string; reused: boolean }
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

export default function ShareButton({ templateId }: { templateId: string }) {
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function onCreate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/templates/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_id: templateId, reuse_existing: true }),
      });
      const json = (await res.json().catch(() => null)) as ApiRes | null;

      if (!res.ok || !json || !json.ok) {
        setError((json as any)?.error || "共有リンク作成に失敗しました。");
        return;
      }
      setShareUrl(json.share_url);
    } catch (e: any) {
      setError(e?.message || "共有リンク作成に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  async function onCopy() {
    if (!shareUrl) return;
    await copyToClipboard(`${location.origin}${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onCreate}
          disabled={loading}
          className={cn(
            "rounded-xl px-3 py-2 text-sm font-semibold text-white",
            loading ? "bg-neutral-300" : "bg-emerald-600 hover:bg-emerald-700"
          )}
        >
          {loading ? "作成中…" : "共有リンクを作成"}
        </button>

        <button
          type="button"
          onClick={onCopy}
          disabled={!shareUrl}
          className={cn(
            "rounded-xl border px-3 py-2 text-sm font-semibold",
            shareUrl ? "border-neutral-200 text-neutral-800 hover:bg-neutral-50" : "border-neutral-100 text-neutral-400"
          )}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {shareUrl && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-800">
          <div className="text-xs font-semibold text-neutral-600">共有URL</div>
          <div className="mt-1 break-all">{`${typeof window !== "undefined" ? location.origin : ""}${shareUrl}`}</div>
        </div>
      )}
    </div>
  );
}
