import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getRequestUser, unauthorized } from "@/lib/api-auth";
import { LOAN_RULES, maxLoanForSalary, quoteLoan } from "@/lib/loan-rules";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const loanApplicationSchema = z.object({
  amount: z.number().min(LOAN_RULES.minAmount).max(LOAN_RULES.maxAmount),
  termMonths: z.number().int().min(LOAN_RULES.minTermMonths).max(LOAN_RULES.maxTermMonths),
});

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return unauthorized();

  const loans = await prisma.loan.findMany({
    where: { userId: user.id },
    include: { repayments: { orderBy: { dueDate: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(loans);
}

export async function POST(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const data = loanApplicationSchema.parse(body);

    const employment = await prisma.employmentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!employment) {
      return NextResponse.json(
        { message: "Employment profile not found" },
        { status: 400 }
      );
    }

    const maxLoan = maxLoanForSalary(Number(employment.monthlySalary));
    if (data.amount > maxLoan) {
      return NextResponse.json(
        { message: `Loan amount exceeds maximum allowed (ZMW ${maxLoan.toLocaleString()})` },
        { status: 400 }
      );
    }

    const quote = quoteLoan(data.amount, data.termMonths);

    // The active-loan check and the insert run in one serializable transaction
    // so two simultaneous submissions can't both create a loan.
    const loan = await prisma.$transaction(
      async (tx) => {
        const activeLoan = await tx.loan.findFirst({
          where: { userId: user.id, status: { in: ["PENDING", "APPROVED", "ACTIVE"] } },
          select: { id: true },
        });
        if (activeLoan) return null;
        return tx.loan.create({
          data: {
            userId: user.id,
            amount: data.amount,
            interestRate: LOAN_RULES.annualInterestRate,
            termMonths: data.termMonths,
            monthlyRepayment: quote.monthlyRepayment,
            status: "PENDING",
          },
        });
      },
      { isolationLevel: "Serializable" }
    );

    if (!loan) {
      return NextResponse.json(
        { message: "You already have an active loan application" },
        { status: 400 }
      );
    }

    await audit("LOAN_APPLICATION_SUBMITTED", {
      userId: user.id,
      req: request,
      metadata: { loanId: loan.id, amount: data.amount, termMonths: data.termMonths, channel: user.via },
    });

    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }
    if ((error as { code?: string })?.code === "P2034") {
      return NextResponse.json({ message: "Please try again" }, { status: 409 });
    }
    console.error("Loan application error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
