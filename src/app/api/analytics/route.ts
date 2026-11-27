import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRequestUser, unauthorized } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const q = z.object({ months: z.coerce.number().int().min(1).max(24).default(6) });
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Financial overview built only from the caller's own records.
 * Months with no activity are returned as zeros (not invented values).
 */
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();
  const parsed = q.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ message: "Invalid range" }, { status: 400 });
  const { months } = parsed.data;

  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));

  const [transactions, loans] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id, createdAt: { gte: start } },
      select: { type: true, amount: true, createdAt: true },
    }),
    prisma.loan.findMany({
      where: { userId: user.id },
      include: { repayments: { select: { amount: true, status: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const buckets = new Map<string, { month: string; disbursed: number; repaid: number; fees: number; count: number }>();
  for (let i = 0; i < months; i++) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    const key = d.toISOString().slice(0, 7);
    buckets.set(key, { month: key, disbursed: 0, repaid: 0, fees: 0, count: 0 });
  }
  for (const t of transactions) {
    const b = buckets.get(t.createdAt.toISOString().slice(0, 7));
    if (!b) continue;
    const a = Number(t.amount);
    if (t.type === "DISBURSEMENT") b.disbursed += a;
    else if (t.type === "REPAYMENT") b.repaid += a;
    else b.fees += a;
    b.count++;
  }
  const monthly = Array.from(buckets.values()).map((b) => ({
    ...b,
    disbursed: round2(b.disbursed),
    repaid: round2(b.repaid),
    fees: round2(b.fees),
  }));

  const statusCounts: Record<string, number> = {};
  let totalBorrowedAllTime = 0;
  for (const l of loans) {
    statusCounts[l.status] = (statusCounts[l.status] ?? 0) + 1;
    if (["ACTIVE", "COMPLETED", "DEFAULTED"].includes(l.status)) totalBorrowedAllTime += Number(l.amount);
  }

  const active = loans.find((l) => l.status === "ACTIVE");
  const repaymentProgress =
    active && active.repayments.length > 0
      ? {
          loanId: active.id,
          paidInstallments: active.repayments.filter((r) => r.status === "PAID").length,
          totalInstallments: active.repayments.length,
          amountPaid: round2(active.repayments.filter((r) => r.status === "PAID").reduce((s, r) => s + Number(r.amount), 0)),
          amountOutstanding: round2(active.repayments.filter((r) => r.status !== "PAID").reduce((s, r) => s + Number(r.amount), 0)),
        }
      : null;

  return NextResponse.json({
    range: { months, from: start.toISOString(), to: now.toISOString() },
    totals: {
      disbursed: round2(monthly.reduce((s, m) => s + m.disbursed, 0)),
      repaid: round2(monthly.reduce((s, m) => s + m.repaid, 0)),
      fees: round2(monthly.reduce((s, m) => s + m.fees, 0)),
      transactionCount: transactions.length,
    },
    monthly,
    loans: { total: loans.length, byStatus: statusCounts, totalBorrowedAllTime: round2(totalBorrowedAllTime) },
    repaymentProgress,
  });
}
