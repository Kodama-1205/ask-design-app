// app/checkout/checkout-client.tsx
"use client";

import { useSearchParams, useRouter } from "next/navigation";

export default function CheckoutClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const plan = sp.get("plan") ?? "free";

  return (
    <div className="min-h-dvh bg-white">
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-neutral-500">Ask Design</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900">
            チェックアウト（準備中）
          </h1>

          <div className="mt-4 text-sm text-neutral-700">
            選択中のプラン：
            <span className="ml-2 font-semibold text-neutral-900">{plan}</span>
          </div>

          <div className="mt-4 text-sm text-neutral-600">
            Stripe 決済は次のステップで実装します。
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={() => router.push("/pricing")}
              className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
            >
              料金に戻る
            </button>

            <button
              onClick={() => router.push("/input")}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              /input へ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
