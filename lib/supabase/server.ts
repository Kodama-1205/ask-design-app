// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";

function parseCookieHeader(cookieHeader: string | null): Array<{ name: string; value: string }> {
  if (!cookieHeader) return [];
  return cookieHeader
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((pair) => {
      const idx = pair.indexOf("=");
      if (idx === -1) return { name: pair, value: "" };
      return { name: pair.slice(0, idx), value: decodeURIComponent(pair.slice(idx + 1)) };
    });
}

function getAllCookiesCompat(cookieStore: ReturnType<typeof cookies>) {
  // Nextのバージョン差で cookieStore.getAll が無い環境があるためフォールバック
  const anyStore: any = cookieStore as any;

  if (typeof anyStore.getAll === "function") {
    return anyStore.getAll().map((c: any) => ({ name: c.name, value: c.value }));
  }

  // フォールバック：headers() の Cookie をパース
  return parseCookieHeader(headers().get("cookie"));
}

export async function createClient() {
  const cookieStore = cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Supabase env is missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return getAllCookiesCompat(cookieStore);
      },
      setAll(cookiesToSet) {
        // Server Components から set されるケースがあるので try/catch で安全に
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // noop
        }
      },
    },
  });
}
