import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { calculateMaxLoanAmount } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
  const maxLoan = calculateMaxLoanAmount(monthlySalary);
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
