// lib/askdesign/options.ts
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export const SKILL_LEVEL_OPTIONS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner', label: '初心者' },
  { value: 'intermediate', label: '中級' },
  { value: 'advanced', label: '上級' },
];

// ✅ ツールは減らさない（あなたが使ってきた6つを固定）
export const TOOL_OPTIONS = ['ChatGPT', 'Gemini', 'Claude', 'Excel', 'Slack', 'Notion'] as const;

// 文字列 -> known/unknown に分解
export function splitTools(toolsRaw: string): { known: string[]; unknown: string[] } {
  const parts = (toolsRaw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const knownSet = new Set<string>(TOOL_OPTIONS as unknown as string[]);
  const known: string[] = [];
  const unknown: string[] = [];

  for (const p of parts) {
    if (knownSet.has(p)) known.push(p);
    else unknown.push(p);
  }

  return { known, unknown };
}

// known + custom -> 文字列
export function joinTools(known: string[], custom: string): string {
  const a = (known ?? []).map((s) => s.trim()).filter(Boolean);
  const b = (custom ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return [...a, ...b].join(', ');
}
