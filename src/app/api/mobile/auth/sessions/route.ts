import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser, unauthorized } from "@/lib/api-auth";
import { revokeAllSessions } from "@/lib/mobile-auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Active mobile sessions (devices) for the signed-in user. */
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();
  const sessions = await prisma.mobileSession.findMany({
    where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, deviceName: true, createdAt: true, lastUsedAt: true, ipAddress: true },
    orderBy: { lastUsedAt: "desc" },
  });
  return NextResponse.json(sessions.map((s) => ({ ...s, current: s.id === user.sessionId })));
}

/** Sign out of every device. */
export async function DELETE(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();
  const count = await revokeAllSessions(user.id, "logout_all");
  await audit("LOGOUT_ALL", { userId: user.id, req, metadata: { revoked: count } });
  return NextResponse.json({ revoked: count });
}
