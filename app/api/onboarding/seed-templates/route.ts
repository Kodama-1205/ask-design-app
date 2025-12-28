import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

type SeedTemplate = {
  title: string;
  content: string;
  inputs: any;
  pinned?: boolean;
};

const SEEDS: SeedTemplate[] = [
  {
    title: '週次レポート自動化（Excel + Slack）',
    content:
      '【役割】あなたは業務自動化の専門家です。\n\n【目的】Excelで集計したレポートをSlackへ共有する運用を、初心者でも実装できるように手順化してください。\n\n【要件】\n- 入力データの例\n- 集計手順（関数 or ピボット）\n- Slack投稿の手順（例文付き）\n- 注意点・チェックリスト\n- 確認質問を3つ\n',
    inputs: {
      goal: 'Excelで集計した週次レポートをSlackへ共有したい',
      context: '初心者。まずは手順ベースで再現できる方法が知りたい。',
      skill_level: 'beginner',
      tools: 'Excel, Slack',
    },
    pinned: false,
  },
  {
    title: 'プロンプト改善（構造化）',
    content:
      '【役割】あなたはプロンプト設計の専門家です。\n\n【目的】ユーザーの要件を整理し、抜け漏れがない“実務で使えるプロンプト”に仕上げてください。\n\n【出力】\n- 完成プロンプト\n- 追加で確認すべき質問（3つ）\n',
    inputs: {
      goal: '要件を整理して完成プロンプトを作りたい',
      context: '目的は明確だが、必要情報が抜けがち。',
      skill_level: 'intermediate',
      tools: 'ChatGPT',
    },
    pinned: false,
  },
];

function admin() {
  return createClient(
    mustEnv('NEXT_PUBLIC_SUPABASE_URL'),
    mustEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } }
  );
}

// ✅ GETでも「何が悪いか」見えるようにする（405回避）
export async function GET() {
  try {
    const supabase = admin();

    const { count, error } = await supabase
      .from('templates')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json(
        { ok: false, step: 'count', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { ok: true, count: count ?? 0, message: 'Use POST to seed. (POST with {user_id} if required)' },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, step: 'exception', error: e?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = admin();
    const body = await req.json().catch(() => ({}));

    // ✅ user_id が NOT NULL のDBでも動くように受け取り可能にする
    const user_id = typeof body?.user_id === 'string' ? body.user_id : null;

    // 既にseed済みなら何もしない
    const { count, error: countErr } = await supabase
      .from('templates')
      .select('*', { count: 'exact', head: true });

    if (countErr) {
      return NextResponse.json(
        { ok: false, step: 'count', error: countErr.message },
        { status: 500 }
      );
    }
    if ((count ?? 0) > 0) {
      return NextResponse.json({ ok: true, seeded: false, reason: 'already seeded' }, { status: 200 });
    }

    const rows = SEEDS.map((t) => ({
      ...(user_id ? { user_id } : {}),
      title: t.title,
      content: t.content,
      inputs: t.inputs,
      pinned: t.pinned ?? false,
    }));

    const { data, error: insErr } = await supabase.from('templates').insert(rows).select('id');

    if (insErr) {
      return NextResponse.json(
        {
          ok: false,
          step: 'insert',
          error: insErr.message,
          hint:
            'templates.user_id が NOT NULL の場合、POSTに { "user_id": "<ログインユーザーID>" } を付けて呼んでください。',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, seeded: true, inserted: data?.length ?? 0 }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, step: 'exception', error: e?.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
