// app/api/generate/route.ts
import { NextResponse } from 'next/server';

type Payload = {
  goal?: string;
  context?: string;
  skill_level?: string;
  tools?: string;
};

function baseUrl() {
  const v = process.env.DIFY_BASE_URL || process.env.NEXT_PUBLIC_DIFY_BASE_URL;
  if (!v) throw new Error('DIFY_BASE_URL is not set');
  return v.replace(/\/$/, '');
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.DIFY_API_KEY;
    if (!apiKey) throw new Error('DIFY_API_KEY is not set');

    const body = (await req.json()) as Payload;

    const res = await fetch(`${baseUrl()}/v1/workflows/run`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          goal: body.goal ?? '',
          context: body.context ?? '',
          skill_level: body.skill_level ?? 'beginner',
          tools: body.tools ?? '',
        },
        response_mode: 'blocking',
        user: 'ask-design-app',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: 'Dify failed', status: res.status, detail: text }, { status: 500 });
    }

    const json = await res.json();
    const outputs = json?.data?.outputs ?? json?.outputs ?? {};
    const generated_prompt = outputs.generated_prompt ?? outputs.prompt ?? '';
    const explanation = outputs.explanation ?? outputs.reason ?? '';

    if (!generated_prompt) {
      return NextResponse.json({ error: 'No generated_prompt', raw: json }, { status: 500 });
    }

    return NextResponse.json({ generated_prompt, explanation });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
