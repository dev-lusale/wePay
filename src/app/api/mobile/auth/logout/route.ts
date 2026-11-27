import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revokeSessionByRefreshToken } from "@/lib/mobile-auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const schema = z.object({ refreshToken: z.string().min(20).max(200) });

/** Revokes the session that owns this refresh token. Always answers 200 so it can't be used as an oracle. */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (parsed.success) {
    const s = await revokeSessionByRefreshToken(parsed.data.refreshToken, "logout");
    if (s) await audit("LOGOUT", { userId: s.userId, req, metadata: { sessionId: s.id } });
  }
  return NextResponse.json({ message: "Signed out" });
}
