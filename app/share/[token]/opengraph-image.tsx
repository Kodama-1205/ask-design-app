// app/share/[token]/opengraph-image.tsx
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// OG画像サイズ（推奨）
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// ✅ ここは default export ではなく named export: `Image`
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          fontSize: 64,
          fontWeight: 700,
        }}
      >
        Ask Design
      </div>
    ),
    {
      width: size.width,
      height: size.height,
    }
  );
}
