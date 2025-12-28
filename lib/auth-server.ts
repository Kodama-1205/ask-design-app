import { cookies } from "next/headers";
import { verifyToken, getAuthCookieName } from "@/lib/auth";

export async function requireUser() {
  const store = await cookies();
  const token = store.get(getAuthCookieName())?.value;
  if (!token) return null;

  try {
    const payload = await verifyToken(token);
    return { userId: payload.userId, email: payload.email };
  } catch {
    return null;
  }
}
