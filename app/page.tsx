import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontWeight: 900 }}>Prompt Generator</h1>
      <p>まずは /input へ</p>
      <Link href="/input">/input を開く</Link>
    </div>
  );
}
