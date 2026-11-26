import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { createCookie } from "react-router";
import { db } from "./db.server";
import { loginSessions } from "./db/schema";

const SESSION_DURATION_SECONDS = 30 * 24 * 60 * 60;

function getConfiguredPassword(): string {
  const password = process.env.PASSWORD;
  if (!password) throw new Error("PASSWORD must be set");
  return password;
}

const expectedPassword = getConfiguredPassword();

const sessionCookie = createCookie("notes_session", {
  httpOnly: true,
  maxAge: SESSION_DURATION_SECONDS,
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function passwordMatches(input: string, expected: string) {
  const inputHash = createHash("sha256").update(input).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(inputHash, expectedHash);
}

export async function createLoginSession(password: string) {
  if (!passwordMatches(password, expectedPassword)) return null;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  await db.delete(loginSessions).where(lt(loginSessions.expiresAt, new Date()));
  await db.insert(loginSessions).values({ tokenHash: hashToken(token), expiresAt });

  return sessionCookie.serialize(token);
}

export async function getLoginSession(request: Request) {
  const token = await sessionCookie.parse(request.headers.get("Cookie"));
  if (typeof token !== "string" || token.length === 0) return null;

  const tokenHash = hashToken(token);
  const [session] = await db
    .select()
    .from(loginSessions)
    .where(and(eq(loginSessions.tokenHash, tokenHash), gt(loginSessions.expiresAt, new Date())))
    .limit(1);

  if (session) return tokenHash;

  await db.delete(loginSessions).where(eq(loginSessions.tokenHash, tokenHash));
  return null;
}

export async function destroyLoginSession(request: Request) {
  const token = await sessionCookie.parse(request.headers.get("Cookie"));
  if (typeof token === "string" && token.length > 0) {
    await db.delete(loginSessions).where(eq(loginSessions.tokenHash, hashToken(token)));
  }

  return sessionCookie.serialize("", { maxAge: 0 });
}
