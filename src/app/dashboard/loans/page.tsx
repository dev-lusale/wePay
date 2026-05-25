import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, calculateMaxLoanAmount } from "@/lib/utils";
import { PlusCircle, Calendar, TrendingUp, Clock, CheckCircle2, XCircle } from "lucide-react";

const statusConfig = {
  PENDING: { label: "Pending Review", variant: "warning" as const, icon: Clock },
  APPROVED: { label: "Approved", variant: "info" as const, icon: CheckCircle2 },
  ACTIVE: { label: "Active", variant: "success" as const, icon: TrendingUp },
  COMPLETED: { label: "Completed", variant: "secondary" as const, icon: CheckCircle2 },
  DEFAULTED: { label: "Defaulted", variant: "destructive" as const, icon: XCircle },
};

export default async function LoansPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      employmentProfile: true,
      loans: {
        include: { repayments: { orderBy: { dueDate: "asc" } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) redirect("/login");

  const monthlySalary = user.employmentProfile
    ? Number(user.employmentProfile.monthlySalary)
    : 0;
  const maxLoan = calculateMaxLoanAmount(monthlySalary);
  const activeLoans = user.loans.filter((l) =>
    ["ACTIVE", "PENDING", "APPROVED"].includes(l.status)
  );
  const hasActiveLoan = activeLoans.length > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1a1f36]">My Loans</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your loan applications and repayments
          </p>
        </div>
        {!hasActiveLoan && (
          <Link href="/dashboard/loans/apply">
            <Button variant="navy" className="rounded-full">
              <PlusCircle size={16} className="mr-2" />
              Apply for Loan
            </Button>
          </Link>
        )}
      </div>

      {/* Loan Eligibility Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Your Maximum Loan Amount</p>
            <p className="text-4xl font-black mt-1">{formatCurrency(maxLoan)}</p>
            <p className="text-white/70 text-sm mt-2">
              Based on 3× your monthly salary of {formatCurrency(monthlySalary)}
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center">
              <TrendingUp size={36} className="text-white" />
            </div>
          </div>
        </div>
        {!hasActiveLoan && (
          <div className="mt-4">
            <Link href="/dashboard/loans/apply">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 rounded-full font-bold">
                Apply Now
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Loans List */}
      {user.loans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={28} className="text-gray-400" />
          </div>
          <h3 className="font-bold text-gray-700 text-lg">No loans yet</h3>
          <p className="text-gray-400 text-sm mt-2 mb-6 max-w-sm mx-auto">
            You haven&apos;t applied for any loans. Apply today and get funds within 24 hours.
          </p>
          <Link href="/dashboard/loans/apply">
            <Button variant="navy" className="rounded-full">
              Apply for Your First Loan
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {user.loans.map((loan) => {
            const config = statusConfig[loan.status];
            const StatusIcon = config.icon;
            const paidCount = loan.repayments.filter((r) => r.status === "PAID").length;
            const progress = loan.repayments.length > 0
              ? (paidCount / loan.repayments.length) * 100
              : 0;
            const nextRepayment = loan.repayments.find((r) => r.status === "PENDING");

            return (
              <div
                key={loan.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <StatusIcon size={16} className="text-gray-500" />
                      <Badge variant={config.variant}>{config.label}</Badge>
                    </div>
                    <p className="text-3xl font-black text-[#1a1f36]">
                      {formatCurrency(Number(loan.amount))}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Applied {formatDate(loan.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Monthly Payment</p>
                    <p className="text-xl font-bold text-[#1a1f36]">
                      {formatCurrency(Number(loan.monthlyRepayment))}
                    </p>
                  </div>
                </div>

                {/* Loan details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Interest Rate", value: `${loan.interestRate}% p.a.` },
                    { label: "Term", value: `${loan.termMonths} months` },
                    { label: "Disbursed", value: loan.disbursedAt ? formatDate(loan.disbursedAt) : "Pending" },
                    { label: "Repayments", value: `${paidCount}/${loan.repayments.length}` },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="font-semibold text-[#1a1f36] text-sm mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar for active loans */}
                {loan.status === "ACTIVE" && loan.repayments.length > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>Repayment Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-green-400 to-emerald-500 h-2.5 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Next repayment */}
                {nextRepayment && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600 bg-orange-50 rounded-xl px-4 py-2.5 border border-orange-100">
                    <Calendar size={14} className="text-orange-500" />
                    <span>
                      Next payment of{" "}
                      <strong>{formatCurrency(Number(nextRepayment.amount))}</strong>{" "}
                      due on <strong>{formatDate(nextRepayment.dueDate)}</strong>
                    </span>
                  </div>
                )}

                {/* Repayment schedule (collapsed) */}
                {loan.repayments.length > 0 && (
                  <details className="mt-4">
                    <summary className="text-sm font-medium text-blue-600 cursor-pointer hover:text-blue-700">
                      View repayment schedule ({loan.repayments.length} payments)
                    </summary>
                    <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                      {loan.repayments.map((repayment, index) => (
                        <div
                          key={repayment.id}
                          className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                              {index + 1}
                            </span>
                            <span className="text-gray-600">{formatDate(repayment.dueDate)}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="font-semibold">{formatCurrency(Number(repayment.amount))}</span>
                            <Badge
                              variant={
                                repayment.status === "PAID"
                                  ? "success"
                                  : repayment.status === "OVERDUE"
                                  ? "destructive"
                                  : "warning"
                              }
                            >
                              {repayment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
