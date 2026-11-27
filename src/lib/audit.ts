import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getClientIp, getUserAgent } from "@/lib/request-meta";

export type AuditAction =
  | "REGISTER"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGIN_RATE_LIMITED"
  | "TOKEN_REFRESH"
  | "REFRESH_TOKEN_REUSE"
  | "LOGOUT"
  | "LOGOUT_ALL"
  | "SESSION_REVOKED"
  | "PASSWORD_RESET_REQUESTED"
  | "PASSWORD_RESET_FAILED"
  | "PASSWORD_RESET_COMPLETED"
  | "LOAN_APPLICATION_SUBMITTED";

/**
 * Records a security- or money-relevant event. Never pass passwords, tokens,
 * reset codes or full NRC/NAPSA numbers in metadata. Failures are logged but
 * never break the request.
 */
export async function audit(
  action: AuditAction,
  opts: { userId?: string | null; req?: Request; metadata?: Record<string, unknown> } = {}
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId: opts.userId ?? null,
        ipAddress: opts.req ? getClientIp(opts.req) : null,
        userAgent: opts.req ? getUserAgent(opts.req) : null,
        metadata: (opts.metadata as Prisma.InputJsonValue) ?? undefined,
      },
    });
  } catch (err) {
    console.error("[audit] failed to record", action, err);
  }
}
