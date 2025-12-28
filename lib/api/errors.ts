// lib/api/errors.ts
export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "TIMEOUT"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR";

export type ApiErrorPayload = {
  ok: false;
  code: ApiErrorCode;
  message: string;
  status: number;
  detail?: string | null;
  hint?: string | null;
};

export type ApiOk<T> = { ok: true } & T;

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  detail?: string | null,
  hint?: string | null
): ApiErrorPayload {
  return {
    ok: false,
    status,
    code,
    message,
    detail: detail ?? null,
    hint: hint ?? null,
  };
}

export function mapStatusToCode(status: number): ApiErrorCode {
  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 429) return "RATE_LIMITED";
  if (status === 504) return "TIMEOUT";
  if (status >= 500 && status <= 599) return "INTERNAL_ERROR";
  return "UPSTREAM_ERROR";
}

export function userMessageByCode(code: ApiErrorCode): string {
  switch (code) {
    case "BAD_REQUEST":
      return "入力内容に不備があります。確認して再度お試しください。";
    case "UNAUTHORIZED":
      return "ログインが必要です。再度ログインしてください。";
    case "FORBIDDEN":
      return "権限がありません。";
    case "NOT_FOUND":
      return "対象が見つかりません。";
    case "CONFLICT":
      return "競合が発生しました。少し待ってから再度お試しください。";
    case "RATE_LIMITED":
      return "短時間にリクエストが多すぎます。少し待ってから再度お試しください。";
    case "TIMEOUT":
      return "処理がタイムアウトしました。通信状況を確認して再度お試しください。";
    case "UPSTREAM_ERROR":
      return "外部サービスの処理に失敗しました。少し待ってから再度お試しください。";
    case "INTERNAL_ERROR":
    default:
      return "内部エラーが発生しました。時間をおいて再度お試しください。";
  }
}
