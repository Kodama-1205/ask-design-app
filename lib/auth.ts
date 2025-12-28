import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "ask_design_token";

export function getAuthCookieName() {
  return COOKIE_NAME;
}

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set in .env");
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: { userId: string; email: string }) {
  const secretKey = getSecretKey();
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey);
}

export async function verifyToken(token: string) {
  const secretKey = getSecretKey();
  const { payload } = await jwtVerify(token, secretKey);
  return payload as { userId: string; email: string; iat: number; exp: number };
}
