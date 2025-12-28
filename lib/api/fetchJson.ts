// lib/api/fetchJson.ts
import { mapStatusToCode, userMessageByCode, type ApiErrorPayload } from "./errors";

export async function fetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T | ApiErrorPayload> {
  try {
    const res = await fetch(input, init);

    const ct = res.headers.get("content-type") || "";
    const isJson = ct.includes("application/json");

    const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

    if (res.ok) {
      return data as T;
    }

    // すでに標準形のエラーならそのまま返す
    if (data && typeof data === "object" && (data as any).ok === false && (data as any).code && (data as any).message) {
      return data as ApiErrorPayload;
    }

    const code = mapStatusToCode(res.status);
    const message =
      (data && typeof data === "object" && ((data as any).error || (data as any).message)) ||
      userMessageByCode(code);

    const detail =
      data && typeof data === "object"
        ? ((data as any).detail || (data as any).dify_response || null)
            ? JSON.stringify((data as any).detail || (data as any).dify_response || null).slice(0, 800)
            : null
        : typeof data === "string"
          ? data.slice(0, 800)
          : null;

    return {
      ok: false,
      status: res.status,
      code,
      message: String(message),
      detail,
      hint: null,
    } satisfies ApiErrorPayload;
  } catch (e: any) {
    const code = "UPSTREAM_ERROR";
    return {
      ok: false,
      status: 0,
      code,
      message: userMessageByCode(code),
      detail: e?.message ? String(e.message).slice(0, 800) : null,
      hint: "ネットワーク接続を確認してください。",
    };
  }
}
