import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser, notFound, unauthorized } from "@/lib/api-auth";
import { revokeSession } from "@/lib/mobile-auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();
  const session = await prisma.mobileSession.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true },
  });
  if (!session) return notFound("Session not found");
  await revokeSession(session.id, "revoked_by_user");
  await audit("SESSION_REVOKED", { userId: user.id, req, metadata: { sessionId: session.id } });
  return NextResponse.json({ revoked: true });
}
