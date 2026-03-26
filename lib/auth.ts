import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "geoscheduler-secret-key-change-in-production"
);

export const COOKIE_NAME = "gs_admin_token";

export async function createToken(
  userId: string,
  email: string
): Promise<string> {
  return new SignJWT({ userId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
}

export async function verifyToken(
  token: string
): Promise<{ userId: string; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { userId: string; email: string };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<{
  userId: string;
  email: string;
} | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
