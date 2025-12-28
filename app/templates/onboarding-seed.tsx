// app/templates/onboarding-seed.tsx
"use client";

import { useEffect, useState } from "react";

const LS_KEY = "ask_design_onboarding_seeded_v1";

export default function OnboardingSeed() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const seeded = localStorage.getItem(LS_KEY);
    if (seeded === "1") {
      setDone(true);
      return;
    }

    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/api/onboarding/seed-templates", { method: "POST" });
        const json = await res.json().catch(() => null);

        // 200系ならseed判定に関わらず “試行済み” として記録（連打防止）
        if (res.ok) {
          localStorage.setItem(LS_KEY, "1");
          if (!cancelled) setDone(true);
          return;
        }

        // 401等は未ログインの可能性があるので記録しない
        if (!cancelled) setDone(true);
        void json;
      } catch {
        if (!cancelled) setDone(true);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  // 何も表示しない（裏でseed）
  return done ? null : null;
}
