"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "promptgen_payload";
type SkillLevel = "初心者" | "中級" | "上級";

export default function InputPage() {
  const router = useRouter();

  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [skillLevel, setSkillLevel] = useState<SkillLevel>("初心者");
  const [tools, setTools] = useState("");

  const canSubmit = useMemo(() => {
    return goal.trim() && context.trim() && skillLevel && tools.trim();
  }, [goal, context, skillLevel, tools]);

  const payload = useMemo(
    () => ({
      goal: goal.trim(),
      context: context.trim(),
      skill_level: skillLevel,
      tools: tools.trim(),
    }),
    [goal, context, skillLevel, tools]
  );

  const onSubmit = () => {
    if (!canSubmit) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    router.push("/result");
  };

  const fillExample = () => {
    setGoal("DifyのWorkflowでプロンプト生成アプリを完成させたい");
    setContext("入力フォームは完成。/result で見やすく表示しCopyボタンも付けたい。");
    setSkillLevel("初心者");
    setTools("Dify, Next.js, Slack");
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.h1}>/input</h1>

        <div style={styles.card}>
          <div style={styles.label}>目的（goal）</div>
          <textarea style={styles.ta} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="何を達成したいか" />
        </div>

        <div style={styles.card}>
          <div style={styles.label}>現状（context）</div>
          <textarea
            style={styles.ta}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="今どんな状態か / 課題は何か"
          />
        </div>

        <div style={styles.grid2}>
          <div style={styles.card}>
            <div style={styles.label}>スキル（skill_level）</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(["初心者", "中級", "上級"] as SkillLevel[]).map((lv) => (
                <button
                  key={lv}
                  onClick={() => setSkillLevel(lv)}
                  style={{ ...styles.pill, ...(skillLevel === lv ? styles.pillActive : {}) }}
                >
                  {lv}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.label}>使用ツール（tools）</div>
            <input style={styles.input} value={tools} onChange={(e) => setTools(e.target.value)} placeholder="例：Excel, Slack, Gmail" />
          </div>
        </div>

        <div style={styles.card}>
          <div style={styles.label}>送信payload（確認用）</div>
          <pre style={styles.pre}>{JSON.stringify(payload, null, 2)}</pre>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", flexWrap: "wrap" }}>
          <button style={styles.btnGhost} onClick={fillExample}>例を入力</button>
          <button style={{ ...styles.btn, ...(canSubmit ? {} : styles.btnDisabled) }} onClick={onSubmit} disabled={!canSubmit}>
            生成する →
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24 },
  container: { maxWidth: 900, margin: "0 auto", display: "grid", gap: 16 },
  h1: { fontSize: 26, fontWeight: 900 },
  card: { border: "1px solid #e5e7eb", borderRadius: 14, padding: 16 },
  label: { fontWeight: 900, marginBottom: 8 },
  ta: { width: "100%", minHeight: 120, padding: 12, borderRadius: 12, border: "1px solid #d1d5db", lineHeight: 1.7 },
  input: { width: "100%", padding: 12, borderRadius: 12, border: "1px solid #d1d5db" },
  pre: { margin: 0, fontSize: 12, overflowX: "auto" },
  grid2: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 },
  pill: { border: "1px solid #d1d5db", borderRadius: 999, padding: "10px 14px", fontWeight: 900, background: "transparent", cursor: "pointer" },
  pillActive: { borderColor: "#16a34a", background: "rgba(22,163,74,0.12)" },
  btn: { background: "#16a34a", color: "#fff", border: "none", padding: "12px 16px", borderRadius: 12, fontWeight: 900, cursor: "pointer" },
  btnGhost: { background: "transparent", border: "1px solid #d1d5db", padding: "12px 16px", borderRadius: 12, fontWeight: 900, cursor: "pointer" },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },
};
