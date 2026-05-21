import { jwtVerify, SignJWT } from "jose";

import type { SessionUser } from "@/types/auth";

export const SESSION_COOKIE_NAME = "dcc_session";

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters long.");
  }

  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(getAuthSecret());
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());

    if (!payload.sub || typeof payload.email !== "string" || typeof payload.name !== "string") {
      return null;
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    } satisfies SessionUser;
  } catch {
    return null;
  }
}
