import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createMobileSession } from "@/lib/mobile-auth";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { getClientIp, getUserAgent } from "@/lib/request-meta";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
  deviceName: z.string().max(100).optional(),
});

// Compared against when the email doesn't exist, so response time doesn't reveal which accounts exist.
const DUMMY_HASH = "$2a$12$hUxcV12gYbB9Uj9zzPUZrO2hr9GlyZ3mF0OTgzA7kp2Du.77Y1c56";
const INVALID = { message: "Invalid email or password" };

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Enter a valid email and password" }, { status: 400 });
  }
  const { email, password, deviceName } = parsed.data;
  const ip = getClientIp(req);

  const [byIp, byEmail] = await Promise.all([
    rateLimit(`login:ip:${ip}`, 30, 15 * 60),
    rateLimit(`login:email:${email.toLowerCase()}`, 8, 15 * 60),
  ]);
  if (!byIp.allowed || !byEmail.allowed) {
    await audit("LOGIN_RATE_LIMITED", { req, metadata: { email } });
    return tooManyRequests(15 * 60);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, password: true, firstName: true, lastName: true, role: true },
  });
  const ok = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);
  if (!user || !ok) {
    await audit("LOGIN_FAILED", { userId: user?.id, req, metadata: { email, channel: "mobile" } });
    return NextResponse.json(INVALID, { status: 401 });
  }

  const tokens = await createMobileSession(user, {
    deviceName,
    ipAddress: ip,
    userAgent: getUserAgent(req),
  });
  await audit("LOGIN_SUCCESS", { userId: user.id, req, metadata: { channel: "mobile", sessionId: tokens.sessionId } });

  return NextResponse.json({
    ...tokens,
    user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
  });
}
