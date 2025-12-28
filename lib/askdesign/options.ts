// lib/askdesign/options.ts

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export const SKILL_LEVEL_OPTIONS: Array<{ value: SkillLevel; label: string }> = [
  { value: 'beginner', label: '初心者' },
  { value: 'intermediate', label: '中級' },
  { value: 'advanced', label: '上級' },
];

export const TOOL_OPTIONS = [
  'ChatGPT',
  'Gemini',
  'Claude',
  'Excel',
  'Slack',
  'Notion',
  'GitHub',
  'Dify',
  'bolt.new',
] as const;

export function splitTools(toolsRaw: string) {
  const parts = String(toolsRaw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const known: string[] = [];
  const unknown: string[] = [];

  for (const p of parts) {
    if ((TOOL_OPTIONS as readonly string[]).includes(p)) known.push(p);
    else unknown.push(p);
  }

  return { known, unknown };
}

export function joinTools(selected: string[], customTool: string) {
  const list = [...selected];
  const extra = String(customTool ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const x of extra) if (!list.includes(x)) list.push(x);
  return list.join(', ');
}
