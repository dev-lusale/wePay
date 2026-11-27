/**
 * Integration tests for the mobile-facing API. They call the real route
 * handlers against a real PostgreSQL database (DATABASE_URL), so they cover
 * auth, authorization, user isolation and loan rules end-to-end.
 *
 *   DATABASE_URL=postgresql://.../wepay_test MOBILE_JWT_SECRET=... npm run test:api
 *
 * WARNING: the suite TRUNCATES all tables. Never point it at production.
 */
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
import { calculateMonthlyRepayment } from "@/lib/utils";
import { call, freshIp, resetDb, userPayload } from "./helpers";

import * as register from "@/app/api/auth/register/route";
import * as login from "@/app/api/mobile/auth/login/route";
import * as refresh from "@/app/api/mobile/auth/refresh/route";
import * as logout from "@/app/api/mobile/auth/logout/route";
import * as sessions from "@/app/api/mobile/auth/sessions/route";
import * as sessionById from "@/app/api/mobile/auth/sessions/[id]/route";
import * as forgot from "@/app/api/mobile/auth/forgot-password/route";
import * as reset from "@/app/api/mobile/auth/reset-password/route";
import * as profile from "@/app/api/user/profile/route";
import * as stats from "@/app/api/dashboard/stats/route";
import * as loans from "@/app/api/loans/route";
import * as loanQuote from "@/app/api/loans/quote/route";
import * as loanById from "@/app/api/loans/[id]/route";
import * as txs from "@/app/api/transactions/route";
import * as txById from "@/app/api/transactions/[id]/route";
import * as analytics from "@/app/api/analytics/route";

if (!process.env.DATABASE_URL?.includes("test")) {
  throw new Error("Refusing to run: DATABASE_URL must point at a *test* database (name containing 'test').");
}

async function registerAndLogin(n: string, overrides: Record<string, unknown> = {}) {
  const payload = userPayload(n, overrides);
  const r = await call(register.POST as any, { body: payload, ip: freshIp() });
  assert.equal(r.status, 201, JSON.stringify(r.json));
  const l = await call(login.POST as any, {
    body: { email: payload.email, password: payload.password, deviceName: `Phone ${n}` },
    ip: freshIp(),
  });
  assert.equal(l.status, 200, JSON.stringify(l.json));
  return { payload, userId: r.json.userId as string, ...l.json };
}

before(resetDb);
after(async () => {
  await prisma.$disconnect();
});

describe("registration & login", () => {
  test("registers, stores a bcrypt hash and logs in", async () => {
    const a = await registerAndLogin("1");
    const row = await prisma.user.findUnique({ where: { id: a.userId } });
    assert.ok(row!.password.startsWith("$2"), "password must be hashed");
    assert.notEqual(row!.password, a.payload.password);
    assert.equal(a.user.email, a.payload.email);
    assert.equal(typeof a.accessToken, "string");
    assert.equal(typeof a.refreshToken, "string");
    const s = await prisma.mobileSession.findFirst({ where: { userId: a.userId } });
    assert.notEqual(s!.refreshTokenHash, a.refreshToken, "refresh token must be stored hashed");
  });

  test("wrong password and unknown email give the same generic 401", async () => {
    const p = userPayload("1");
    const wrong = await call(login.POST as any, { body: { email: p.email, password: "nope-nope" }, ip: freshIp() });
    const unknown = await call(login.POST as any, { body: { email: "ghost@example.com", password: "nope-nope" }, ip: freshIp() });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.deepEqual(wrong.json, unknown.json);
  });

  test("duplicate email is rejected", async () => {
    const r = await call(register.POST as any, { body: userPayload("1", { nrcNumber: "OTHER/1/1", napsaNumber: "OTHERNAPSA" }), ip: freshIp() });
    assert.equal(r.status, 400);
  });

  test("login is rate limited per email", async () => {
    await registerAndLogin("9");
    let last = 0;
    for (let i = 0; i < 9; i++) {
      const r = await call(login.POST as any, { body: { email: userPayload("9").email, password: "wrong-pass" }, ip: freshIp() });
      last = r.status;
    }
    assert.equal(last, 429);
  });
});

describe("authorization", () => {
  test("rejects missing, malformed, forged and expired tokens", async () => {
    const a = await registerAndLogin("2");
    assert.equal((await call(profile.GET as any)).status, 401, "no auth");
    assert.equal((await call(profile.GET as any, { authorization: "Basic abc" })).status, 401, "malformed");
    assert.equal((await call(profile.GET as any, { token: a.accessToken + "x" })).status, 401, "tampered");

    const forged = await new SignJWT({ sid: "x", typ: "access" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(a.userId)
      .setIssuer("wepay-api")
      .setAudience("wepay-mobile")
      .setExpirationTime("10m")
      .sign(new TextEncoder().encode("some-other-secret-that-is-long-enough-123"));
    assert.equal((await call(profile.GET as any, { token: forged })).status, 401, "wrong key");

    const s = await prisma.mobileSession.findFirst({ where: { userId: a.userId } });
    const expired = await new SignJWT({ sid: s!.id, typ: "access", role: "BORROWER" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(a.userId)
      .setIssuer("wepay-api")
      .setAudience("wepay-mobile")
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(process.env.MOBILE_JWT_SECRET!));
    assert.equal((await call(profile.GET as any, { token: expired })).status, 401, "expired");

    const ok = await call(profile.GET as any, { token: a.accessToken });
    assert.equal(ok.status, 200);
    assert.equal(ok.json.email, a.payload.email);
    assert.equal(ok.json.password, undefined, "password hash must never be returned");
  });
});

describe("loans", () => {
  test("quote uses the backend's rules (18% p.a., 3× salary cap)", async () => {
    const a = await registerAndLogin("3", { monthlySalary: 10000 });
    const q = await call(loanQuote.GET as any, { path: "/api/loans/quote?amount=5000&termMonths=12", token: a.accessToken });
    assert.equal(q.status, 200);
    assert.equal(q.json.maxLoan, 30000);
    assert.equal(q.json.rules.annualInterestRate, 18);
    assert.equal(q.json.quote.monthlyRepayment, calculateMonthlyRepayment(5000, 18, 12));
    assert.equal(q.json.quote.totalRepayment, Math.round(q.json.quote.monthlyRepayment * 12 * 100) / 100);
    assert.equal(q.json.canApply, true);

    const over = await call(loanQuote.GET as any, { path: "/api/loans/quote?amount=40000&termMonths=12", token: a.accessToken });
    assert.equal(over.json.quote.exceedsLimit, true);
    const bad = await call(loanQuote.GET as any, { path: "/api/loans/quote?amount=10&termMonths=12", token: a.accessToken });
    assert.equal(bad.status, 400);
  });

  test("application enforces limit, one open loan, and stores server-side figures", async () => {
    const a = await registerAndLogin("4", { monthlySalary: 10000 });
    const tooBig = await call(loans.POST as any, { body: { amount: 40000, termMonths: 12 }, token: a.accessToken });
    assert.equal(tooBig.status, 400);

    const ok = await call(loans.POST as any, { body: { amount: 5000, termMonths: 12 }, token: a.accessToken });
    assert.equal(ok.status, 201);
    assert.equal(ok.json.status, "PENDING", "never auto-approved");
    assert.equal(Number(ok.json.monthlyRepayment), calculateMonthlyRepayment(5000, 18, 12));

    const again = await call(loans.POST as any, { body: { amount: 1000, termMonths: 6 }, token: a.accessToken });
    assert.equal(again.status, 400);

    const logs = await prisma.auditLog.findMany({ where: { userId: a.userId, action: "LOAN_APPLICATION_SUBMITTED" } });
    assert.equal(logs.length, 1);
  });

  test("concurrent applications create at most one loan", async () => {
    const a = await registerAndLogin("5");
    const results = await Promise.all(
      [1, 2, 3].map(() => call(loans.POST as any, { body: { amount: 2000, termMonths: 6 }, token: a.accessToken }))
    );
    assert.equal(results.filter((r) => r.status === 201).length, 1, JSON.stringify(results.map((r) => r.status)));
    assert.equal(await prisma.loan.count({ where: { userId: a.userId } }), 1);
  });

  test("loan detail: estimated schedule when none issued, official when it exists", async () => {
    const a = await registerAndLogin("6");
    const created = await call(loans.POST as any, { body: { amount: 3000, termMonths: 3 }, token: a.accessToken });
    const d = await call(loanById.GET as any, { token: a.accessToken, params: { id: created.json.id } });
    assert.equal(d.status, 200);
    assert.equal(d.json.schedule.kind, "estimated");
    assert.equal(d.json.schedule.rows.length, 3);
    assert.equal(d.json.schedule.outstandingBalance, null, "no invented balance");
    const principal = d.json.schedule.rows.reduce((s: number, r: any) => s + r.principal, 0);
    assert.ok(Math.abs(principal - 3000) < 0.05);

    // Simulate an admin issuing a schedule and one payment.
    await prisma.loan.update({ where: { id: created.json.id }, data: { status: "ACTIVE", disbursedAt: new Date() } });
    const m = Number(created.json.monthlyRepayment);
    await prisma.loanRepayment.createMany({
      data: [1, 2, 3].map((i) => ({
        loanId: created.json.id,
        dueDate: new Date(Date.now() + i * 30 * 86400000),
        amount: m,
        status: i === 1 ? ("PAID" as const) : ("PENDING" as const),
        paidAt: i === 1 ? new Date() : null,
      })),
    });
    const d2 = await call(loanById.GET as any, { token: a.accessToken, params: { id: created.json.id } });
    assert.equal(d2.json.schedule.kind, "official");
    assert.equal(d2.json.schedule.paidCount, 1);
    assert.equal(d2.json.schedule.outstandingBalance, Math.round(m * 2 * 100) / 100);
  });
});

describe("user data isolation", () => {
  test("user B can't see user A's profile, loans, transactions or analytics", async () => {
    const a = await registerAndLogin("7", { monthlySalary: 20000 });
    const b = await registerAndLogin("8", { monthlySalary: 5000 });

    const loan = await call(loans.POST as any, { body: { amount: 10000, termMonths: 12 }, token: a.accessToken });
    await prisma.transaction.createMany({
      data: [
        { userId: a.userId, type: "DISBURSEMENT", amount: 10000, description: "Loan disbursement" },
        { userId: a.userId, type: "REPAYMENT", amount: 916.8, description: "Salary deduction repayment" },
        { userId: a.userId, type: "FEE", amount: 50, description: "Late fee" },
      ],
    });
    const aTx = await prisma.transaction.findFirst({ where: { userId: a.userId } });

    // Profile
    const bp = await call(profile.GET as any, { token: b.accessToken });
    assert.equal(bp.json.email, b.payload.email);
    // Loans
    assert.equal((await call(loans.GET as any, { token: b.accessToken })).json.length, 0);
    assert.equal((await call(loanById.GET as any, { token: b.accessToken, params: { id: loan.json.id } })).status, 404);
    // Transactions
    assert.equal((await call(txs.GET as any, { token: b.accessToken })).json.length, 0);
    assert.equal((await call(txById.GET as any, { token: b.accessToken, params: { id: aTx!.id } })).status, 404);
    // Analytics & dashboard
    const ban = await call(analytics.GET as any, { token: b.accessToken });
    assert.equal(ban.json.totals.transactionCount, 0);
    const bs = await call(stats.GET as any, { token: b.accessToken });
    assert.equal(bs.json.monthlySalary, 5000);
    assert.equal(bs.json.activeLoans, 0);

    // A sees their own
    const at = await call(txs.GET as any, { token: a.accessToken });
    assert.equal(at.json.length, 3);
    const filtered = await call(txs.GET as any, { path: "/api/transactions?type=REPAYMENT", token: a.accessToken });
    assert.equal(filtered.json.length, 1);
    const searched = await call(txs.GET as any, { path: "/api/transactions?q=salary", token: a.accessToken });
    assert.equal(searched.json.length, 1);
    const aan = await call(analytics.GET as any, { path: "/api/analytics?months=3", token: a.accessToken });
    assert.equal(aan.json.totals.disbursed, 10000);
    assert.equal(aan.json.totals.repaid, 916.8);
    assert.equal(aan.json.totals.fees, 50);
    assert.equal(aan.json.monthly.length, 3);

    // Session listing / revocation of another user's session is impossible
    const aSessions = await call(sessions.GET as any, { token: a.accessToken });
    const bTryRevoke = await call(sessionById.DELETE as any, { method: "DELETE", token: b.accessToken, params: { id: aSessions.json[0].id } });
    assert.equal(bTryRevoke.status, 404);
    assert.equal((await call(profile.GET as any, { token: a.accessToken })).status, 200);
  });
});

describe("sessions", () => {
  test("refresh rotates; replaying an old refresh token revokes the session", async () => {
    const a = await registerAndLogin("10");
    const r1 = await call(refresh.POST as any, { body: { refreshToken: a.refreshToken }, ip: freshIp() });
    assert.equal(r1.status, 200);
    assert.notEqual(r1.json.refreshToken, a.refreshToken);
    assert.equal((await call(profile.GET as any, { token: r1.json.accessToken })).status, 200);

    const replay = await call(refresh.POST as any, { body: { refreshToken: a.refreshToken }, ip: freshIp() });
    assert.equal(replay.status, 401);
    // Whole session is now dead, including the newest tokens.
    assert.equal((await call(refresh.POST as any, { body: { refreshToken: r1.json.refreshToken }, ip: freshIp() })).status, 401);
    assert.equal((await call(profile.GET as any, { token: r1.json.accessToken })).status, 401);
    assert.equal(await prisma.auditLog.count({ where: { userId: a.userId, action: "REFRESH_TOKEN_REUSE" } }), 1);
  });

  test("logout revokes immediately; sign-out-everywhere revokes all devices", async () => {
    const a = await registerAndLogin("11");
    const second = await call(login.POST as any, { body: { email: a.payload.email, password: a.payload.password }, ip: freshIp() });

    await call(logout.POST as any, { body: { refreshToken: a.refreshToken } });
    assert.equal((await call(profile.GET as any, { token: a.accessToken })).status, 401);
    assert.equal((await call(profile.GET as any, { token: second.json.accessToken })).status, 200);

    const third = await call(login.POST as any, { body: { email: a.payload.email, password: a.payload.password }, ip: freshIp() });
    const all = await call(sessions.DELETE as any, { method: "DELETE", token: third.json.accessToken });
    assert.equal(all.json.revoked, 2);
    assert.equal((await call(profile.GET as any, { token: second.json.accessToken })).status, 401);
    assert.equal((await call(profile.GET as any, { token: third.json.accessToken })).status, 401);
  });
});

describe("password reset", () => {
  test("code flow: attempt limit, success, old sessions revoked, new password works", async () => {
    const a = await registerAndLogin("12");
    const codes: string[] = [];
    const orig = console.info;
    console.info = (...args: unknown[]) => {
      const m = /code for .*: (\d{6})/.exec(String(args[0]));
      if (m) codes.push(m[1]);
    };
    try {
      const f = await call(forgot.POST as any, { body: { email: a.payload.email }, ip: freshIp() });
      assert.equal(f.status, 200);
      const ghost = await call(forgot.POST as any, { body: { email: "ghost@example.com" }, ip: freshIp() });
      assert.deepEqual(ghost.json, f.json, "no account enumeration");
      assert.equal(codes.length, 1);

      const wrong = codes[0] === "000000" ? "111111" : "000000";
      for (let i = 0; i < 5; i++) {
        const w = await call(reset.POST as any, { body: { email: a.payload.email, code: wrong, newPassword: "NewPassword-1" }, ip: freshIp() });
        assert.equal(w.status, 400);
      }
      const locked = await call(reset.POST as any, { body: { email: a.payload.email, code: codes[0], newPassword: "NewPassword-1" }, ip: freshIp() });
      assert.equal(locked.status, 400, "code locked after 5 wrong attempts");

      await call(forgot.POST as any, { body: { email: a.payload.email }, ip: freshIp() });
      const ok = await call(reset.POST as any, { body: { email: a.payload.email, code: codes[1], newPassword: "NewPassword-1" }, ip: freshIp() });
      assert.equal(ok.status, 200, JSON.stringify(ok.json));
      const reuse = await call(reset.POST as any, { body: { email: a.payload.email, code: codes[1], newPassword: "Another-1234" }, ip: freshIp() });
      assert.equal(reuse.status, 400, "code is single use");
    } finally {
      console.info = orig;
    }
    assert.equal((await call(profile.GET as any, { token: a.accessToken })).status, 401, "sessions revoked");
    assert.equal((await call(login.POST as any, { body: { email: a.payload.email, password: a.payload.password }, ip: freshIp() })).status, 401);
    assert.equal((await call(login.POST as any, { body: { email: a.payload.email, password: "NewPassword-1" }, ip: freshIp() })).status, 200);
  });

  test("in production without SMTP, forgot-password says so instead of pretending", async () => {
    const env = process.env as Record<string, string | undefined>;
    const prev = env.NODE_ENV;
    env.NODE_ENV = "production";
    try {
      const r = await call(forgot.POST as any, { body: { email: "x@example.com" }, ip: freshIp() });
      assert.equal(r.status, 503);
    } finally {
      env.NODE_ENV = prev;
    }
  });
});

describe("audit trail", () => {
  test("records security events without secrets", async () => {
    const logs = await prisma.auditLog.findMany();
    const actions = new Set(logs.map((l) => l.action));
    for (const a of ["REGISTER", "LOGIN_SUCCESS", "LOGIN_FAILED", "LOGIN_RATE_LIMITED", "LOAN_APPLICATION_SUBMITTED", "LOGOUT", "LOGOUT_ALL", "PASSWORD_RESET_COMPLETED"]) {
      assert.ok(actions.has(a), `missing ${a}`);
    }
    const blob = JSON.stringify(logs);
    assert.ok(!/Password-\d|NewPassword|refreshToken|accessToken/.test(blob), "no secrets in audit log");
  });
});
