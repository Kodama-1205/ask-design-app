import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-green-700">
            Ask Design
          </div>
          <div className="text-xs text-gray-500">
            MVP / No login
          </div>
        </div>

        {/* Hero */}
        <div className="mt-12 rounded-2xl border border-gray-200 p-10 shadow-sm">
          <h1 className="text-4xl font-bold leading-tight text-gray-900">
            AIに<strong className="text-green-700">「何を聞けばいいか」</strong>を
            <br />
            迷わず作れる。
          </h1>

          <p className="mt-5 text-gray-700 leading-relaxed">
            目的・現状・スキル・使用ツールを入れるだけで、
            <br />
            AIが答えやすい「質問文（プロンプト）」に整形します。
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/input"
              className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-white font-semibold hover:bg-green-700"
            >
              利用開始
            </Link>

            <Link
              href="/input"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-3 text-gray-800 font-semibold hover:bg-gray-50"
            >
              まずは試す
            </Link>
          </div>

          {/* Small points */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-green-50 p-4">
              <div className="text-sm font-semibold text-green-800">
                入力は4つだけ
              </div>
              <div className="mt-1 text-sm text-gray-700">
                目的 / 現状 / スキル / ツール
              </div>
            </div>

            <div className="rounded-xl bg-green-50 p-4">
              <div className="text-sm font-semibold text-green-800">
                そのままコピペ
              </div>
              <div className="mt-1 text-sm text-gray-700">
                生成結果はコピーしやすい形式
              </div>
            </div>

            <div className="rounded-xl bg-green-50 p-4">
              <div className="text-sm font-semibold text-green-800">
                再生成も簡単
              </div>
              <div className="mt-1 text-sm text-gray-700">
                条件を変えてすぐ試せる
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-10 text-xs text-gray-500">
          © {new Date().getFullYear()} Ask Design
        </div>
      </div>
    </main>
  );
}
