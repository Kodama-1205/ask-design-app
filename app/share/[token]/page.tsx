// app/share/[token]/page.tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { headers } from "next/headers";

type Share = {
  token: string;
  title: string | null;
  generated_prompt: string;
  explanation: string | null;
  created_at: string;
};

async function getShare(token: string): Promise<Share | null> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = `${proto}://${host}`;

  const res = await fetch(`${base}/api/share/get`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  if (!json || json.ok !== true) return null;
  return json.share as Share;
}

export async function generateMetadata({ params }: { params: { token: string } }) {
  const share = await getShare(params.token);
  const title = share?.title?.trim() || "Ask Design - Shared Prompt";
  const description =
    (share?.explanation?.trim() || share?.generated_prompt?.trim() || "").slice(0, 140);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/share/${params.token}/opengraph-image`],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/share/${params.token}/opengraph-image`],
    },
  };
}

export default async function SharePage({ params }: { params: { token: string } }) {
  const share = await getShare(params.token);

  if (!share) {
    return (
      <div className="min-h-dvh bg-white">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="text-sm text-neutral-500">Ask Design</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
              共有リンクが見つかりません
            </h1>
            <div className="mt-3 text-sm text-neutral-600">
              URL が間違っているか、削除された可能性があります。
            </div>
          </div>
        </div>
      </div>
    );
  }

  const title = share.title?.trim() || "Shared Prompt";

  return (
    <div className="min-h-dvh bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm text-neutral-500">Ask Design</div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              {title}
            </h1>
            <div className="mt-1 text-xs text-neutral-500">
              Shared • {new Date(share.created_at).toLocaleString()}
            </div>
          </div>

          <a
            href="/input"
            className="inline-flex rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            自分でも作る
          </a>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 px-5 py-4">
              <div className="text-sm font-semibold text-neutral-900">generated_prompt</div>
            </div>
            <div className="px-5 py-5">
              <div className="prose prose-neutral max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {share.generated_prompt || ""}
                </ReactMarkdown>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
            <div className="border-b border-neutral-100 px-5 py-4">
              <div className="text-sm font-semibold text-neutral-900">explanation</div>
            </div>
            <div className="px-5 py-5">
              <div className="prose prose-neutral max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {share.explanation || "—"}
                </ReactMarkdown>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <div className="text-sm font-semibold text-neutral-900">共有URL</div>
          <div className="mt-2 text-sm text-neutral-700 break-words">
            /share/{share.token}
          </div>
        </div>
      </div>
    </div>
  );
}
