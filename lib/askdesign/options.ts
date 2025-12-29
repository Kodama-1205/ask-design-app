// lib/askdesign/options.ts

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export const SKILL_LEVEL_OPTIONS: ReadonlyArray<{ value: SkillLevel; label: string }> = [
  { value: 'beginner', label: '初心者' },
  { value: 'intermediate', label: '中級者' },
  { value: 'advanced', label: '上級者' },
];

// ✅ ここが /input のボタン一覧のソース
export const TOOL_OPTIONS = [
  'ChatGPT',
  'Gemini',
  'Claude',
  'Dify',
  'bolt.new',
  'Excel',
  'Slack',
  'Notion',
] as const;

const normalize = (s: string) => s.trim();

export function splitTools(raw: string): { known: string[]; unknown: string[] } {
  const tokens = (raw ?? '')
    .split(',')
    .map(normalize)
    .filter(Boolean);

  const knownSet = new Set<string>(TOOL_OPTIONS as unknown as string[]);

  const known: string[] = [];
  const unknown: string[] = [];

  for (const t of tokens) {
    if (knownSet.has(t)) known.push(t);
    else unknown.push(t);
  }

  return { known, unknown };
}

export function joinTools(known: string[], custom: string): string {
  const customTokens = (custom ?? '')
    .split(',')
    .map(normalize)
    .filter(Boolean);

  const merged = [...known, ...customTokens]
    .map(normalize)
    .filter(Boolean);

  // 重複排除（順序維持）
  const seen = new Set<string>();
  const uniq: string[] = [];
  for (const t of merged) {
    if (seen.has(t)) continue;
    seen.add(t);
    uniq.push(t);
  }

  return uniq.join(', ');
}
