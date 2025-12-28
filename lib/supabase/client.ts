// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

let _client: any | null = null;

export function createClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // ✅ ビルド/プリレンダー時に env が無い場合でも落とさない
  if (!url || !key) {
    _client = {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signInWithPassword: async () => ({ data: { user: null, session: null }, error: { message: 'Supabase env missing' } }),
        signOut: async () => ({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
    };
    return _client;
  }

  _client = createBrowserClient(url, key);
  return _client;
}
