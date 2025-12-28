// lib/promptTargets.ts
export type TargetAI = "chatgpt" | "gemini" | "claude";

export type FormatPromptInput = {
  target: TargetAI;
  generated_prompt: string;
  explanation?: string;
  title?: string;
};

function clean(s: string) {
  return (s ?? "").replace(/\r\n/g, "\n").trim();
}

function safeTitle(title?: string) {
  const t = clean(title || "");
  return t ? t : "Prompt";
}

function withFooterHint(target: TargetAI) {
  if (target === "chatgpt") {
    return [
      "",
      "----",
      "If anything is unclear, ask concise clarifying questions first.",
      "Then proceed with the best assumption set.",
    ].join("\n");
  }
  if (target === "gemini") {
    return ["", "---", "If something is ambiguous, ask clarifying questions first."].join("\n");
  }
  // claude
  return [
    "",
    "<notes>",
    "If something is ambiguous, ask concise clarifying questions first, then proceed.",
    "</notes>",
  ].join("\n");
}

export function formatForTargetAI(input: FormatPromptInput): { formatted_prompt: string } {
  const target = input.target;
  const gp = clean(input.generated_prompt);
  const exp = clean(input.explanation || "");
  const title = safeTitle(input.title);

  if (!gp) return { formatted_prompt: "" };

  if (target === "chatgpt") {
    const formatted = [
      `# ${title}`,
      "",
      "## Instructions",
      "You are an expert assistant. Follow the prompt below precisely.",
      "",
      "## Prompt",
      gp,
      exp ? "" : "",
      exp ? "## Notes / Rationale" : "",
      exp ? exp : "",
      withFooterHint(target),
    ]
      .filter((v) => v !== "")
      .join("\n");

    return { formatted_prompt: formatted.trim() };
  }

  if (target === "gemini") {
    const formatted = [
      `# ${title}`,
      "",
      "## Task",
      gp,
      exp ? "" : "",
      exp ? "## Context" : "",
      exp ? exp : "",
      withFooterHint(target),
    ]
      .filter((v) => v !== "")
      .join("\n");

    return { formatted_prompt: formatted.trim() };
  }

  // claude (XML-structured tends to work well)
  const formatted = [
    `<prompt_bundle>`,
    `  <title>${title.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</title>`,
    `  <prompt>`,
    gp
      .split("\n")
      .map((line) => `    ${line}`)
      .join("\n"),
    `  </prompt>`,
    exp
      ? [
          `  <explanation>`,
          exp
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n"),
          `  </explanation>`,
        ].join("\n")
      : "",
    `</prompt_bundle>`,
    withFooterHint(target),
  ]
    .filter((v) => v !== "")
    .join("\n");

  return { formatted_prompt: formatted.trim() };
}
