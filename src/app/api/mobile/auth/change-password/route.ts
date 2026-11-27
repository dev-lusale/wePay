import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRequestUser, unauthorized } from "@/lib/api-auth";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const schema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

/**
 * Change password while signed in. Requires the current password. Signs out
 * every OTHER mobile device; the device making the change stays signed in.
 */
export async function POST(req: NextRequest) {
  const authed = await getRequestUser(req);
  if (!authed) return unauthorized();

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0]?.message ?? "Invalid password" }, { status: 400 });
  }
  const rl = await rateLimit(`chpw:user:${authed.id}`, 5, 15 * 60);
  if (!rl.allowed) return tooManyRequests(15 * 60);

  const user = await prisma.user.findUnique({ where: { id: authed.id }, select: { id: true, password: true } });
  if (!user) return unauthorized();
  if (!(await bcrypt.compare(parsed.data.currentPassword, user.password))) {
    await audit("PASSWORD_RESET_FAILED", { userId: user.id, req, metadata: { reason: "wrong_current_password" } });
    return NextResponse.json({ message: "Your current password is incorrect" }, { status: 400 });
  }
  if (await bcrypt.compare(parsed.data.newPassword, user.password)) {
    return NextResponse.json({ message: "Choose a password different from your current one" }, { status: 400 });
  }

  const now = new Date();
  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(parsed.data.newPassword, 12), passwordChangedAt: now },
  });
  const revoked = await prisma.mobileSession.updateMany({
    where: { userId: user.id, revokedAt: null, ...(authed.sessionId ? { id: { not: authed.sessionId } } : {}) },
    data: { revokedAt: now, revokedReason: "password_changed" },
  });
  await audit("PASSWORD_CHANGED", { userId: user.id, req, metadata: { otherSessionsRevoked: revoked.count } });
  return NextResponse.json({ message: "Password changed", passwordChangedAt: now.toISOString(), otherSessionsRevoked: revoked.count });
}
