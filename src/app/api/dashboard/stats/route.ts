import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRequestUser, unauthorized } from "@/lib/api-auth";
import { maxLoanForSalary } from "@/lib/loan-rules";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authUser = await getRequestUser(request);
  if (!authUser) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    include: {
      employmentProfile: true,
      loans: {
        where: { status: { in: ["ACTIVE", "PENDING", "APPROVED"] } },
        include: {
          repayments: {
            where: { status: "PENDING" },
            orderBy: { dueDate: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  const monthlySalary = user.employmentProfile
    ? Number(user.employmentProfile.monthlySalary)
    : 0;
  const maxLoan = maxLoanForSalary(monthlySalary);
  const activeLoan = user.loans[0];
  const totalBorrowed = activeLoan ? Number(activeLoan.amount) : 0;
  const availableCredit = Math.max(0, maxLoan - totalBorrowed);
  const nextPayment = activeLoan?.repayments[0] ?? null;

  return NextResponse.json({
    totalBalance: availableCredit,
    availableCredit,
    activeLoans: user.loans.length,
    totalBorrowed,
    nextPaymentDate: nextPayment?.dueDate ?? null,
    nextPaymentAmount: nextPayment ? Number(nextPayment.amount) : 0,
    monthlySalary,
  });
}
