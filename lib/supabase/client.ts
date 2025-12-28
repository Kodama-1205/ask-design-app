// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

type AnyClient = any;

let _client: AnyClient | null = null;

/** SSR中はSupabaseを初期化しない（ビルド/プリレンダーで落ちるのを防ぐ） */
function makeDummyClient(reason = 'dummy') {
  const dummy = {
    __isDummy: true,
    __reason: reason,
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({
        data: { user: null, session: null },
        error: { message: 'Supabase env missing or invalid' },
      }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  };
  return dummy;
}

function getValidHttpUrl(raw?: string) {
  const v = (raw ?? '').trim();
  if (!v) return null;
  try {
    const u = new URL(v);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return v;
  } catch {
    return null;
  }
}

export function createClient() {
  const isBrowser = typeof window !== 'undefined';

  // ✅ SSR/ビルド中は常にダミー（= Supabase初期化しない）
  if (!isBrowser) return makeDummyClient('ssr');

  // ✅ ブラウザに来た時、ダミーだったら作り直す
  if (_client && _client.__isDummy !== true) return _client;

  const url = getValidHttpUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

  if (!url || !key) {
    _client = makeDummyClient('missing-env');
    return _client;
  }

  _client = createBrowserClient(url, key);
  return _client;
}
