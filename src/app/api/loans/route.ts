import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { calculateMonthlyRepayment } from "@/lib/utils";

const loanApplicationSchema = z.object({
  amount: z.number().min(500).max(100000),
  termMonths: z.number().min(1).max(36),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const loans = await prisma.loan.findMany({
    where: { userId: session.user.id },
    include: { repayments: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(loans);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = loanApplicationSchema.parse(body);

    // Check employment profile
    const employment = await prisma.employmentProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!employment) {
      return NextResponse.json(
        { message: "Employment profile not found" },
        { status: 400 }
      );
    }

    const maxLoan = Number(employment.monthlySalary) * 3;
    if (data.amount > maxLoan) {
      return NextResponse.json(
        { message: `Loan amount exceeds maximum allowed (ZMW ${maxLoan.toLocaleString()})` },
        { status: 400 }
      );
    }

    // Check for active loans
    const activeLoan = await prisma.loan.findFirst({
      where: {
        userId: session.user.id,
        status: { in: ["PENDING", "APPROVED", "ACTIVE"] },
      },
    });

    if (activeLoan) {
      return NextResponse.json(
        { message: "You already have an active loan application" },
        { status: 400 }
      );
    }

    const INTEREST_RATE = 18; // 18% per annum
    const monthlyRepayment = calculateMonthlyRepayment(data.amount, INTEREST_RATE, data.termMonths);

    const loan = await prisma.loan.create({
      data: {
        userId: session.user.id,
        amount: data.amount,
        interestRate: INTEREST_RATE,
        termMonths: data.termMonths,
        monthlyRepayment,
        status: "PENDING",
      },
    });

    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid data", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Loan application error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
