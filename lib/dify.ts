type DifyRunResponse = any;

function getDifyConfig() {
  const url = process.env.DIFY_API_URL;
  const key = process.env.DIFY_API_KEY;
  if (!url || !key) throw new Error("DIFY_API_URL / DIFY_API_KEY is missing in .env");
  return { url, key };
}

export async function runDifyWorkflow(inputs: Record<string, any>) {
  const { url, key } = getDifyConfig();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inputs,
      response_mode: "blocking",
      user: "webapp",
    }),
  });

  const json: DifyRunResponse = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = json?.message || json?.error || `Dify request failed (${res.status})`;
    throw new Error(msg);
  }

  const outputs = json?.data?.outputs || json?.outputs || json?.data || null;
  const generated_prompt = outputs?.generated_prompt ?? "";
  const explanation = outputs?.explanation ?? "";

  if (!generated_prompt && !explanation) {
    throw new Error("Dify outputs must include generated_prompt and/or explanation");
  }

  return { generated_prompt: String(generated_prompt), explanation: String(explanation) };
}
