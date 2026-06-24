import { cookies } from "next/headers";
import { jwtVerify, SignJWT, type JWTPayload } from "jose";

export const SESSION_COOKIE = "tfd_crm_session";

export type SessionUser = JWTPayload & {
  sub: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "MANAGER" | "TEAM_LEAD" | "AGENT";
};

function getSecret() {
  const value = process.env.JWT_SECRET;
  if (!value && process.env.NODE_ENV !== "production") return new TextEncoder().encode("local-development-secret-change-before-production");
  if (!value) throw new Error("JWT_SECRET is not configured");
  return new TextEncoder().encode(value);
}

export async function createSessionToken(user: Pick<SessionUser, "sub" | "name" | "email" | "role">) {
  return new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.sub)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as SessionUser;
  } catch {
    return null;
  }
}
