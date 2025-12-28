// app/pricing/pricing-client.tsx
"use client";

import { useRouter } from "next/navigation";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type Plan = {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

export default function PricingClient() {
  const router = useRouter();

  const plans: Plan[] = [
    {
      id: "free",
      name: "Free",
      price: "¥0",
      period: "/ 月",
      features: [
        "プロンプト生成（基本）",
        "結果のコピー",
        "テンプレ閲覧",
        "共有リンク（制限あり）",
      ],
      cta: "無料で始める",
    },
    {
      id: "pro",
      name: "Pro",
      price: "¥980",
      period: "/ 月",
      features: [
        "無制限プロンプト生成",
        "AI別最適化（ChatGPT / Gemini / Claude）",
        "共有リンク無制限",
        "履歴保存（予定）",
        "優先サポート（予定）",
      ],
      cta: "Pro を始める",
      highlight: true,
    },
  ];

  function onSelect(planId: string) {
    // いまは決済せず、導線のみ
    router.push(`/checkout?plan=${planId}`);
  }

  return (
    <div className="min-h-dvh bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center">
          <div className="text-sm text-neutral-500">Ask Design</div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">
            料金プラン
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            まずは無料で試し、必要になったら Pro へ。
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {plans.map((p) => (
            <div
              key={p.id}
              className={cn(
                "rounded-2xl border p-6 shadow-sm",
                p.highlight
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-neutral-200 bg-white"
              )}
            >
              <div className="flex items-baseline justify-between">
                <div className="text-lg font-semibold text-neutral-900">{p.name}</div>
                {p.highlight && (
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                    おすすめ
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-end gap-1">
                <div className="text-3xl font-bold text-neutral-900">{p.price}</div>
                <div className="text-sm text-neutral-600">{p.period}</div>
              </div>

              <ul className="mt-6 space-y-2 text-sm text-neutral-700">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => onSelect(p.id)}
                className={cn(
                  "mt-6 w-full rounded-xl px-4 py-2 text-sm font-semibold",
                  p.highlight
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "border border-neutral-200 text-neutral-800 hover:bg-neutral-50"
                )}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-700">
          ※ 決済機能は準備中です。UI と導線のみ先行実装しています。
        </div>
      </div>
    </div>
  );
}
