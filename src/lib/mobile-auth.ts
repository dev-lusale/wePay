import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

/**
 * Token-based auth for the native mobile app.
 *
 * The web app keeps using NextAuth (httpOnly cookie). Native apps can't rely on
 * browser cookies, so they get:
 *  - a short-lived access token (JWT, HS256, 15 min) sent as `Authorization: Bearer`
 *  - a long-lived opaque refresh token (30 days) stored in the device keystore
 *
 * Every refresh rotates the refresh token. Only SHA-256 hashes are stored.
 * Presenting an already-rotated token revokes the whole session (theft signal).
 * Access tokens are tied to a session id that is checked on every request, so
 * logout / "sign out everywhere" / password reset take effect immediately.
 */

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_DAYS = 30;
const ISSUER = "wepay-api";
const AUDIENCE = "wepay-mobile";

function jwtSecret(): Uint8Array {
  const s = process.env.MOBILE_JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error("MOBILE_JWT_SECRET must be set to a random string of at least 32 characters");
  }
  return new TextEncoder().encode(s);
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** HMAC with the server secret — used for short codes (password reset) so a DB leak can't brute-force them offline. */
export function hmac(value: string): string {
  return createHmac("sha256", jwtSecret()).update(value).digest("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function newRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

async function signAccessToken(userId: string, sessionId: string, role: string) {
  return new SignJWT({ sid: sessionId, role, typ: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(jwtSecret());
}

export interface SessionMeta {
  deviceName?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
  refreshTokenExpiresAt: string;
  sessionId: string;
}

export async function createMobileSession(
  user: { id: string; role: string },
  meta: SessionMeta
): Promise<IssuedTokens> {
  const refreshToken = newRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 86_400_000);
  const session = await prisma.mobileSession.create({
    data: {
      userId: user.id,
      refreshTokenHash: sha256(refreshToken),
      deviceName: meta.deviceName?.slice(0, 100) ?? null,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent ?? null,
      expiresAt,
    },
  });
  return {
    accessToken: await signAccessToken(user.id, session.id, user.role),
    refreshToken,
    accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshTokenExpiresAt: expiresAt.toISOString(),
    sessionId: session.id,
  };
}

export type RotateResult =
  | { ok: true; tokens: IssuedTokens; userId: string }
  | { ok: false; reason: "invalid" | "expired" | "reused"; userId?: string };

export async function rotateRefreshToken(refreshToken: string, meta: SessionMeta): Promise<RotateResult> {
  const hash = sha256(refreshToken);
  const session = await prisma.mobileSession.findUnique({
    where: { refreshTokenHash: hash },
    include: { user: { select: { id: true, role: true } } },
  });

  if (!session) {
    // Was this a token we already rotated away? Then someone replayed it.
    const reused = await prisma.mobileSession.findFirst({
      where: { previousTokenHash: hash, revokedAt: null },
    });
    if (reused) {
      await revokeSession(reused.id, "refresh_token_reuse");
      return { ok: false, reason: "reused", userId: reused.userId };
    }
    return { ok: false, reason: "invalid" };
  }
  if (session.revokedAt) return { ok: false, reason: "invalid", userId: session.userId };
  if (session.expiresAt < new Date()) {
    await revokeSession(session.id, "expired");
    return { ok: false, reason: "expired", userId: session.userId };
  }

  const next = newRefreshToken();
  // Compare-and-swap: only one concurrent refresh can win.
  const updated = await prisma.mobileSession.updateMany({
    where: { id: session.id, refreshTokenHash: hash, revokedAt: null },
    data: {
      previousTokenHash: hash,
      refreshTokenHash: sha256(next),
      lastUsedAt: new Date(),
      ipAddress: meta.ipAddress ?? session.ipAddress,
      userAgent: meta.userAgent ?? session.userAgent,
    },
  });
  if (updated.count !== 1) return { ok: false, reason: "invalid", userId: session.userId };

  return {
    ok: true,
    userId: session.userId,
    tokens: {
      accessToken: await signAccessToken(session.user.id, session.id, session.user.role),
      refreshToken: next,
      accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshTokenExpiresAt: session.expiresAt.toISOString(),
      sessionId: session.id,
    },
  };
}

export interface MobilePrincipal {
  userId: string;
  sessionId: string;
  role: string;
}

/** Verifies signature, expiry, issuer/audience AND that the session is still active. */
export async function verifyAccessToken(token: string): Promise<MobilePrincipal | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    if (payload.typ !== "access" || typeof payload.sub !== "string" || typeof payload.sid !== "string") {
      return null;
    }
    const session = await prisma.mobileSession.findUnique({
      where: { id: payload.sid },
      select: { userId: true, revokedAt: true, expiresAt: true },
    });
    if (!session || session.revokedAt || session.expiresAt < new Date() || session.userId !== payload.sub) {
      return null;
    }
    return { userId: payload.sub, sessionId: payload.sid, role: String(payload.role ?? "BORROWER") };
  } catch {
    return null;
  }
}

export async function revokeSession(sessionId: string, reason: string) {
  await prisma.mobileSession.updateMany({
    where: { id: sessionId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
}

export async function revokeSessionByRefreshToken(refreshToken: string, reason: string) {
  const s = await prisma.mobileSession.findUnique({
    where: { refreshTokenHash: sha256(refreshToken) },
    select: { id: true, userId: true },
  });
  if (s) await revokeSession(s.id, reason);
  return s;
}

export async function revokeAllSessions(userId: string, reason: string) {
  const r = await prisma.mobileSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
  return r.count;
}
