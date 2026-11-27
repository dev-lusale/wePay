import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hmac, revokeAllSessions, safeEqualHex } from "@/lib/mobile-auth";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/request-meta";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email().max(254),
  code: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(8).max(200),
});
const MAX_ATTEMPTS = 5;
const INVALID = { message: "That code is invalid or has expired. Request a new one." };

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Enter your email, the 6-digit code and a password of at least 8 characters" }, { status: 400 });
  }
  const { email, code, newPassword } = parsed.data;

  const rl = await rateLimit(`reset:ip:${getClientIp(req)}`, 20, 60 * 60);
  if (!rl.allowed) return tooManyRequests(60 * 60);

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) return NextResponse.json(INVALID, { status: 400 });

  const token = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!token || token.attempts >= MAX_ATTEMPTS) {
    await audit("PASSWORD_RESET_FAILED", { userId: user.id, req, metadata: { reason: token ? "too_many_attempts" : "no_active_code" } });
    return NextResponse.json(INVALID, { status: 400 });
  }

  if (!safeEqualHex(hmac(`${user.id}:${code}`), token.codeHash)) {
    await prisma.passwordResetToken.update({ where: { id: token.id }, data: { attempts: { increment: 1 } } });
    await audit("PASSWORD_RESET_FAILED", { userId: user.id, req, metadata: { reason: "wrong_code" } });
    return NextResponse.json(INVALID, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: hashed, passwordChangedAt: new Date() } }),
    prisma.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: new Date() } }),
  ]);
  const revoked = await revokeAllSessions(user.id, "password_reset");
  await audit("PASSWORD_RESET_COMPLETED", { userId: user.id, req, metadata: { sessionsRevoked: revoked } });

  return NextResponse.json({ message: "Password updated. Please sign in with your new password." });
}
