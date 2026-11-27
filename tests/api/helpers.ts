import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

type Handler = (req: NextRequest, ctx: { params: Record<string, string> }) => Promise<Response>;

let ipCounter = 1;
/** Each test gets a distinct client IP unless one is given, so IP rate limits don't bleed between tests. */
export function freshIp() {
  ipCounter++;
  return `10.0.${Math.floor(ipCounter / 250)}.${ipCounter % 250}`;
}

export async function call(
  handler: Handler,
  opts: {
    method?: string;
    path?: string;
    body?: unknown;
    token?: string;
    authorization?: string;
    params?: Record<string, string>;
    ip?: string;
  } = {}
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-forwarded-for": opts.ip ?? "10.9.9.9",
    "user-agent": "wepay-tests",
  };
  if (opts.token) headers.authorization = `Bearer ${opts.token}`;
  if (opts.authorization) headers.authorization = opts.authorization;
  const req = new NextRequest(`http://localhost${opts.path ?? "/"}`, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  const res = await handler(req, { params: opts.params ?? {} });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, json, headers: res.headers };
}

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE "audit_logs","rate_limit_buckets","password_reset_tokens","mobile_sessions","transactions","loan_repayments","loans","credit_profiles","employment_profiles","users" CASCADE`
  );
}

export function userPayload(n: string, overrides: Record<string, unknown> = {}) {
  return {
    firstName: `First${n}`,
    lastName: `Last${n}`,
    email: `user${n}@example.com`,
    phone: `09700000${n.padStart(2, "0")}`,
    nrcNumber: `NRC${n}/10/1`,
    employerName: `Employer ${n}`,
    napsaNumber: `NAPSA${n}0000`,
    monthlySalary: 10000,
    password: `Password-${n}!`,
    ...overrides,
  };
}
