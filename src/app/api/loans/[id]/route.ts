import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser, notFound, unauthorized } from "@/lib/api-auth";
import { estimateSchedule, quoteLoan } from "@/lib/loan-rules";

export const dynamic = "force-dynamic";

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();

  // Ownership is part of the query: another user's loan id returns 404, never data.
  const loan = await prisma.loan.findFirst({
    where: { id: params.id, userId: user.id },
    include: { repayments: { orderBy: { dueDate: "asc" } } },
  });
  if (!loan) return notFound("Loan not found");

  const amount = Number(loan.amount);
  const rate = Number(loan.interestRate);
  const monthly = Number(loan.monthlyRepayment);
  const totals = quoteLoan(amount, loan.termMonths);

  const repayments = loan.repayments.map((r) => ({
    id: r.id,
    dueDate: r.dueDate,
    amount: Number(r.amount),
    paidAt: r.paidAt,
    status: r.status,
  }));
  const hasOfficialSchedule = repayments.length > 0;
  const paid = repayments.filter((r) => r.status === "PAID");
  const unpaid = repayments.filter((r) => r.status !== "PAID");

  return NextResponse.json({
    id: loan.id,
    status: loan.status,
    amount,
    interestRate: rate,
    termMonths: loan.termMonths,
    monthlyRepayment: monthly,
    totalRepayment: round2(monthly * loan.termMonths),
    totalInterest: round2(monthly * loan.termMonths - amount),
    fees: totals.fees,
    disbursedAt: loan.disbursedAt,
    createdAt: loan.createdAt,
    updatedAt: loan.updatedAt,
    schedule: hasOfficialSchedule
      ? {
          kind: "official" as const,
          repayments,
          paidCount: paid.length,
          totalCount: repayments.length,
          amountPaid: round2(paid.reduce((s, r) => s + r.amount, 0)),
          outstandingBalance: round2(unpaid.reduce((s, r) => s + r.amount, 0)),
          nextRepayment: unpaid[0] ?? null,
        }
      : {
          kind: "estimated" as const,
          note: "No repayment schedule has been issued for this loan yet. These figures are an estimate based on the loan's terms.",
          rows: estimateSchedule(amount, rate, loan.termMonths, monthly, loan.disbursedAt ?? loan.createdAt),
          outstandingBalance: null,
        },
  });
}
