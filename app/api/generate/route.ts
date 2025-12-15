import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const goal = String(body?.goal ?? "");
    const context = String(body?.context ?? "");
    const skillLevel = String(body?.skill_level ?? "beginner");
    const tools = Array.isArray(body?.tools) ? body.tools : [];

    // ダミーの生成結果（後でDifyに差し替える）
    const generated_prompt = `あなたは質問設計コーチです。
目的: ${goal}
現状: ${context}
スキル: ${skillLevel}
使用ツール: ${tools.join(", ")}

上記を踏まえて、私がAIに最初に投げるべき質問を3パターン作ってください。
それぞれ「質問文」と「狙い」をセットで出してください。`;

    const explanation =
      "※いまはDify未接続のため、サンプル（ダミー）応答を返しています。Dify接続後に本番の生成結果に置き換わります。";

    return NextResponse.json({ generated_prompt, explanation });
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
