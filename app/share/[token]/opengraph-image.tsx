// app/share/[token]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { headers } from "next/headers";

export const runtime = "edge";

async function getShare(token: string) {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = `${proto}://${host}`;

  const res = await fetch(`${base}/api/share/get`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  if (!json || json.ok !== true) return null;
  return json.share as { title: string | null; generated_prompt: string; explanation: string | null };
}

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const share = await getShare(params.token);
  const title = share?.title?.trim() || "Ask Design";
  const desc =
    (share?.explanation?.trim() || share?.generated_prompt?.trim() || "Shared Prompt")
      .replace(/\s+/g, " ")
      .slice(0, 140);

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 28, color: "#6b7280" }}>Ask Design</div>
          <div style={{ fontSize: 56, fontWeight: 800, color: "#111827", lineHeight: 1.05 }}>
            {title}
          </div>
          <div style={{ fontSize: 28, color: "#374151", lineHeight: 1.35 }}>
            {desc}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 24, color: "#6b7280" }}>Shared Prompt</div>
          <div style={{ fontSize: 24, color: "#059669", fontWeight: 700 }}>Prompt Generator</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
