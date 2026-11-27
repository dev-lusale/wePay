import { NextRequest, NextResponse } from "next/server";
import { randomInt } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hmac } from "@/lib/mobile-auth";
import { isMailerConfigured, sendMail } from "@/lib/mailer";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/request-meta";

export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().trim().email().max(254) });
const CODE_TTL_MINUTES = 15;
const GENERIC = {
  message: "If an account exists for that email, we've sent a 6-digit reset code. It expires in 15 minutes.",
};

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "Enter a valid email" }, { status: 400 });
  const { email } = parsed.data;

  const devMode = process.env.NODE_ENV !== "production";
  if (!isMailerConfigured() && !devMode) {
    // Be honest: without an email provider we cannot deliver a code.
    return NextResponse.json(
      { message: "Password reset by email isn't available yet. Please contact WePay support." },
      { status: 503 }
    );
  }

  const [byIp, byEmail] = await Promise.all([
    rateLimit(`forgot:ip:${getClientIp(req)}`, 10, 60 * 60),
    rateLimit(`forgot:email:${email.toLowerCase()}`, 3, 60 * 60),
  ]);
  if (!byIp.allowed || !byEmail.allowed) return tooManyRequests(60 * 60);

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });
  if (user) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await prisma.$transaction([
      prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() }, // invalidate older codes
      }),
      prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          codeHash: hmac(`${user.id}:${code}`),
          expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60_000),
        },
      }),
    ]);
    if (isMailerConfigured()) {
      await sendMail(
        user.email,
        "Your WePay password reset code",
        `Your WePay password reset code is ${code}. It expires in ${CODE_TTL_MINUTES} minutes.\n\nIf you didn't request this, you can ignore this email — your password won't change.`
      );
    } else {
      console.info(`[dev only] password reset code for ${user.email}: ${code}`);
    }
    await audit("PASSWORD_RESET_REQUESTED", { userId: user.id, req });
  }
  return NextResponse.json(GENERIC);
}
