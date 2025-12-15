"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResultPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [explanation, setExplanation] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const p = sessionStorage.getItem("askdesign_generated_prompt") ?? "";
    const e = sessionStorage.getItem("askdesign_explanation") ?? "";
    setPrompt(p);
    setExplanation(e);

    if (!p) {
      // 直接/resultに来た場合は/inputへ
      router.replace("/input");
    }
  }, [router]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // noop
    }
  };

  return (
    <main className="min-h-screen bg-white flex justify-center">
      <div className="w-full max-w-2xl px-6 py-10 space-y-6">
        <h1 className="text-2xl font-bold text-green-700">結果</h1>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">生成プロンプト</h2>
            <button
              onClick={onCopy}
              className="px-3 py-2 rounded-lg bg-green-600 text-white"
            >
              {copied ? "コピーしました" : "コピー"}
            </button>
          </div>

          <pre className="w-full whitespace-pre-wrap border rounded-lg p-4 bg-gray-50">
            {prompt}
          </pre>
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold">説明</h2>
          <div className="border rounded-lg p-4 text-gray-700">{explanation}</div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/input"
            className="flex-1 text-center border rounded-lg py-3 font-semibold"
          >
            戻る
          </Link>
          <Link
            href="/input"
            className="flex-1 text-center bg-green-600 text-white rounded-lg py-3 font-semibold"
          >
            再生成（同じ入力で）
          </Link>
        </div>
      </div>
    </main>
  );
}
