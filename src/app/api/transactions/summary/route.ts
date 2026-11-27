import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser, unauthorized } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/** All-time totals of the caller's transactions, by type (same figures as the web Transactions page). */
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();
  const rows = await prisma.transaction.groupBy({
    by: ["type"],
    where: { userId: user.id },
    _sum: { amount: true },
    _count: { _all: true },
  });
  const get = (t: string) => rows.find((r) => r.type === t);
  const total = (t: string) => Math.round(Number(get(t)?._sum.amount ?? 0) * 100) / 100;
  return NextResponse.json({
    totalDisbursed: total("DISBURSEMENT"),
    totalRepaid: total("REPAYMENT"),
    totalFees: total("FEE"),
    count: rows.reduce((s, r) => s + r._count._all, 0),
  });
}
