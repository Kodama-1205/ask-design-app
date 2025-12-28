// app/onboarding/onboarding-client.tsx
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

const LS_INPUTS_KEY = "ask_design_inputs";
const LS_ONBOARDED_KEY = "ask_design_onboarded";

type Demo = {
  id: string;
  title: string;
  subtitle: string;
  inputs: {
    goal: string;
    context: string;
    skill_level: string;
    tools: string; // Dify互換：string
  };
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function setOnboardedCookie() {
  // 1年
  document.cookie = "ask_design_onboarded=1; path=/; max-age=31536000; samesite=lax";
}

export default function OnboardingClient() {
  const router = useRouter();

  const demos = useMemo<Demo[]>(
    () => [
      {
        id: "prompt-generator",
        title: "高品質プロンプトを作る",
        subtitle: "まずは王道：Goal/Context/Skill/Tools で整理して生成",
        inputs: {
          goal: "LLMに渡す『高品質なプロンプト』を作りたい。出力はそのまま貼れる完成プロンプトにしてほしい。",
          context:
            "私はWebアプリ（Next.js + Supabase + Dify）でプロンプト生成を自動化している。入力が曖昧でも、質問→仮定の順で補完して前進したい。",
          skill_level: "初心者",
          tools: "ChatGPT, Gemini, Claude, Dify, Next.js, Supabase",
        },
      },
      {
        id: "workflow-design",
        title: "Dify ワークフロー設計",
        subtitle: "入力スキーマとエラーを崩さずに運用設計したい",
        inputs: {
          goal: "Dify Workflow の入力/出力を安定させ、API側で揺れを吸収できる設計にしたい。実装の注意点も整理したい。",
          context:
            "Next.js(App Router)のRoute HandlerからDifyの/workflows/runを叩く。レスポンスがtext/answer/outputsなど揺れる。フロントは{generated_prompt, explanation}で固定したい。",
          skill_level: "中級",
          tools: "Dify, Next.js, TypeScript, Vercel",
        },
      },
      {
        id: "cad-review",
        title: "設計レビュー用プロンプト",
        subtitle: "要件→チェックリスト→指摘→改善案の順で出す",
        inputs: {
          goal: "鉄骨CAD/3Dモデリングの設計レビューを効率化したい。レビュー観点を網羅したチェックリストと改善案を出してほしい。",
          context:
            "対象は鉄骨構造（階段・倉庫等）。レビュー観点：寸法整合、干渉、接合部、施工性、材料集計、図面表現。必要なら前提条件を質問してほしい。",
          skill_level: "中級",
          tools: "ChatGPT, CAD, IFC, Revit, Tekla, Python",
        },
      },
      {
        id: "sales-report",
        title: "週次レポート自動化",
        subtitle: "集計→グラフ→Slack投稿の手順をプロンプト化",
        inputs: {
          goal: "週次の営業レポートを自動生成したい。集計観点、文章テンプレ、グラフ案、Slack投稿文を作ってほしい。",
          context:
            "カテゴリは野菜/肉/魚/飲料/その他。担当者別・顧客別・日別の集計がある。QuickChartやSlack連携も使う予定。",
          skill_level: "初心者",
          tools: "Python, Google Sheets, Slack, QuickChart, Dify",
        },
      },
    ],
    []
  );

  function startWithDemo(d: Demo) {
    localStorage.setItem(LS_INPUTS_KEY, JSON.stringify(d.inputs));
    localStorage.setItem(LS_ONBOARDED_KEY, "1");
    setOnboardedCookie();
    router.push(`/input?title=${encodeURIComponent(d.title)}`);
  }

  function skip() {
    localStorage.setItem(LS_ONBOARDED_KEY, "1");
    setOnboardedCookie();
    router.push("/input");
  }

  return (
    <div className="min-h-dvh bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm text-neutral-500">Ask Design</div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
              はじめに（デモ）
            </h1>
            <div className="mt-2 text-sm text-neutral-600">
              まずはデモ入力で動作確認できます（あとで自由に編集可能）。
            </div>
          </div>

          <button
            type="button"
            onClick={skip}
            className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
          >
            スキップして /input へ
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {demos.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => startWithDemo(d)}
              className={cn(
                "group text-left rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition",
                "hover:shadow-md hover:border-neutral-300"
              )}
            >
              <div className="text-sm font-semibold text-neutral-900">{d.title}</div>
              <div className="mt-1 text-sm text-neutral-600">{d.subtitle}</div>

              <div className="mt-4 rounded-xl bg-neutral-50 p-3">
                <div className="text-xs font-semibold text-neutral-600">このデモで入る内容</div>
                <div className="mt-2 space-y-2 text-xs text-neutral-700">
                  <div>
                    <span className="font-semibold text-neutral-500">Goal:</span>{" "}
                    {d.inputs.goal.slice(0, 70)}
                    {d.inputs.goal.length > 70 ? "…" : ""}
                  </div>
                  <div>
                    <span className="font-semibold text-neutral-500">Tools:</span>{" "}
                    {d.inputs.tools}
                  </div>
                </div>
              </div>

              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                このデモで開始
                <span className="transition group-hover:translate-x-0.5">→</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <div className="text-sm font-semibold text-neutral-900">補足</div>
          <div className="mt-2 text-sm text-neutral-700">
            デモを選ぶと <code className="rounded bg-white px-1.5 py-0.5">localStorage</code> に入力が保存され、
            <code className="rounded bg-white px-1.5 py-0.5">/input</code> へ移動します。オンボーディング済みは
            Cookie で保持します。
          </div>
        </div>
      </div>
    </div>
  );
}
