import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const list = await prisma.generation.findMany({
    where: { userId: user.userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ list }, { status: 200 });
}
