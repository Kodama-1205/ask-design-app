// proxy.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export default function proxy(_req: NextRequest) {
  // いったん何もしないで素通し（500を止める）
  return NextResponse.next();
}

// すべてに掛ける（必要なら後で絞る）
export const config = {
  matcher: '/:path*',
};
