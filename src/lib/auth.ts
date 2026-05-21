import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import type { SessionUser } from "@/types/auth";

import { db } from "./db";
import { SESSION_COOKIE_NAME, signSession, verifySession } from "./session";

export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifySession(token);
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getCurrentSessionUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function createLoginResponse(user: SessionUser) {
  const token = await signSession(user);

  const response = NextResponse.json({ ok: true, user });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return response;
}

export function createLogoutResponse(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}

export async function getSingleUserCredential() {
  const email = process.env.AUTH_EMAIL;
  const password = process.env.AUTH_PASSWORD;

  if (!email || !password) {
    throw new Error("AUTH_EMAIL and AUTH_PASSWORD must be configured.");
  }

  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    throw new Error(`Configured auth user (${email}) was not found in users table.`);
  }

  return {
    user: {
      id: user.id,
      email: user.email ?? email,
      name: user.displayName,
    } satisfies SessionUser,
    email,
    password,
  };
}
