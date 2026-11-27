import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rotateRefreshToken } from "@/lib/mobile-auth";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { getClientIp, getUserAgent } from "@/lib/request-meta";

export const dynamic = "force-dynamic";

const schema = z.object({ refreshToken: z.string().min(20).max(200) });

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Session expired" }, { status: 401 });

  const ip = getClientIp(req);
  const rl = await rateLimit(`refresh:ip:${ip}`, 120, 15 * 60);
  if (!rl.allowed) return tooManyRequests(15 * 60);

  const result = await rotateRefreshToken(parsed.data.refreshToken, { ipAddress: ip, userAgent: getUserAgent(req) });
  if (!result.ok) {
    if (result.reason === "reused") {
      await audit("REFRESH_TOKEN_REUSE", { userId: result.userId, req });
    }
    return NextResponse.json({ message: "Session expired. Please sign in again." }, { status: 401 });
  }
  return NextResponse.json(result.tokens);
}
