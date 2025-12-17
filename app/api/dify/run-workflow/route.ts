import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { inputs } = await req.json();

    const DIFY_BASE_URL = process.env.DIFY_BASE_URL;
    const DIFY_API_KEY = process.env.DIFY_API_KEY;

    if (!DIFY_BASE_URL || !DIFY_API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error: "ENV_NOT_SET",
          DIFY_BASE_URL: DIFY_BASE_URL ?? null,
          DIFY_API_KEY: DIFY_API_KEY ? "SET" : null,
        },
        { status: 500 }
      );
    }

    const url = `${DIFY_BASE_URL.replace(/\/+$/, "")}/v1/workflows/run`;

    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DIFY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs,
        response_mode: "blocking",
        user: "webapp-user",
      }),
    });

    const contentType = r.headers.get("content-type") || "";
    const bodyText = await r.text();

    // DifyがJSON以外(HTMLなど)を返してきても、必ずJSONで返す
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        {
          ok: false,
          error: "NON_JSON_RESPONSE_FROM_DIFY",
          requestUrl: url,
          status: r.status,
          contentType,
          bodyPreview: bodyText.slice(0, 900),
          hint:
            "DIFY_BASE_URL が Web UI を指している可能性が高いです。https://api.dify.ai にしてください。",
        },
        { status: 502 }
      );
    }

    // JSONとして返す（Difyの成功/失敗もそのまま返す）
    let json: any;
    try {
      json = JSON.parse(bodyText);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "JSON_PARSE_FAILED",
          requestUrl: url,
          status: r.status,
          bodyPreview: bodyText.slice(0, 900),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, dify: json }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", message: e?.message ?? "Unknown" }, { status: 500 });
  }
}
