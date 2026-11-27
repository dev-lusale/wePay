import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRequestUser, unauthorized } from "@/lib/api-auth";
import { LOAN_RULES, maxLoanForSalary, quoteLoan } from "@/lib/loan-rules";

export const dynamic = "force-dynamic";

const q = z.object({
  amount: z.coerce.number().min(LOAN_RULES.minAmount).max(LOAN_RULES.maxAmount).optional(),
  termMonths: z.coerce.number().int().min(LOAN_RULES.minTermMonths).max(LOAN_RULES.maxTermMonths).optional(),
});

/**
 * Server-side loan calculator. Returns the lending rules, the caller's
 * salary-based limit and — if amount & term are given — the repayment figures.
 * This is a quote only: it never implies approval.
 */
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();

  const parsed = q.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid amount or term", errors: parsed.error.errors }, { status: 400 });
  }

  const [employment, openLoan] = await Promise.all([
    prisma.employmentProfile.findUnique({
      where: { userId: user.id },
      select: { monthlySalary: true, verificationStatus: true, employerName: true },
    }),
    prisma.loan.findFirst({
      where: { userId: user.id, status: { in: ["PENDING", "APPROVED", "ACTIVE"] } },
      select: { id: true, status: true },
    }),
  ]);

  const maxLoan = employment ? maxLoanForSalary(Number(employment.monthlySalary)) : 0;
  const { amount, termMonths } = parsed.data;

  return NextResponse.json({
    rules: LOAN_RULES,
    maxLoan,
    employment: employment
      ? { employerName: employment.employerName, verificationStatus: employment.verificationStatus }
      : null,
    canApply: Boolean(employment) && !openLoan,
    blockingReason: !employment
      ? "NO_EMPLOYMENT_PROFILE"
      : openLoan
      ? "OPEN_APPLICATION_OR_LOAN"
      : null,
    openLoan,
    quote: amount !== undefined && termMonths !== undefined ? { ...quoteLoan(amount, termMonths), exceedsLimit: amount > maxLoan } : null,
  });
}
