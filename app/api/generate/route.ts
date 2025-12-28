import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { runDifyWorkflow } from "@/lib/dify";

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => null);
    const inputs = body?.inputs;
    if (!inputs || typeof inputs !== "object") {
      return NextResponse.json({ message: "inputs is missing/invalid" }, { status: 400 });
    }

    const dify = await runDifyWorkflow(inputs);

    const saved = await prisma.generation.create({
      data: {
        userId: user.userId,
        inputJson: JSON.stringify(inputs),
        generatedPrompt: dify.generated_prompt,
        explanation: dify.explanation,
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json({ ok: true, id: saved.id }, { status: 200 });
  } catch (e: any) {
    console.error("[/api/generate]", e);
    return NextResponse.json({ message: e?.message || "Internal Server Error" }, { status: 500 });
  }
}
