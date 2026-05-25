import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { LoanCard } from "@/components/dashboard/LoanCard";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { Button } from "@/components/ui/button";
import { formatCurrency, getGreeting, calculateMaxLoanAmount } from "@/lib/utils";
import {
  PlusCircle,
  ArrowUpRight,
  FileText,
  TrendingUp,
  AlertCircle,
  Wallet,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      employmentProfile: true,
      loans: {
        where: { status: { in: ["ACTIVE", "PENDING", "APPROVED"] } },
        include: { repayments: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) redirect("/login");

  const monthlySalary = user.employmentProfile
    ? Number(user.employmentProfile.monthlySalary)
    : 0;
  const maxLoan = calculateMaxLoanAmount(monthlySalary);
  const activeLoan = user.loans[0] ?? null;
  const totalBorrowed = activeLoan ? Number(activeLoan.amount) : 0;
  const availableCredit = Math.max(0, maxLoan - totalBorrowed);

  const greeting = getGreeting();
  const firstName = user.firstName;

  // Quick stats
  const stats = [
    {
      label: "Available Credit",
      value: formatCurrency(availableCredit),
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
    },
    {
      label: "Active Loans",
      value: activeLoan ? "1" : "0",
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    {
      label: "Monthly Salary",
      value: formatCurrency(monthlySalary),
      icon: ArrowUpRight,
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1a1f36]">
            {greeting}, {firstName}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here&apos;s your financial overview for today
          </p>
        </div>
        <Link href="/dashboard/loans/apply">
          <Button variant="navy" className="rounded-full hidden sm:flex">
            <PlusCircle size={16} className="mr-2" />
            Apply for Loan
          </Button>
        </Link>
      </div>

      {/* Employment verification warning */}
      {user.employmentProfile?.verificationStatus === "PENDING" && (
        <div className="flex items-start space-x-3 bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <AlertCircle size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-800 text-sm">
              Employment Verification Pending
            </p>
            <p className="text-orange-700 text-xs mt-0.5">
              Your NAPSA number is being verified. This usually takes 1-2 business days.
              You can still browse loan options.
            </p>
          </div>
        </div>
      )}

      {/* Balance Card + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BalanceCard
            balance={availableCredit}
            availableCredit={availableCredit}
            monthlySalary={monthlySalary}
          />
        </div>
        <div className="space-y-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`${stat.bg} border ${stat.border} rounded-2xl p-4 flex items-center space-x-4`}
              >
                <div className={`w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm`}>
                  <Icon size={18} className={stat.color} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className={`font-bold text-sm ${stat.color}`}>{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-bold text-[#1a1f36] mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              href: "/dashboard/loans/apply",
              icon: PlusCircle,
              label: "Apply for Loan",
              color: "bg-orange-500",
              desc: "Get funds fast",
            },
            {
              href: "/dashboard/card",
              icon: Wallet,
              label: "Virtual Card",
              color: "bg-blue-600",
              desc: "VISA & Mastercard",
            },
            {
              href: "/dashboard/loans",
              icon: FileText,
              label: "View Loans",
              color: "bg-purple-500",
              desc: "Manage repayments",
            },
            {
              href: "/dashboard/transactions",
              icon: ArrowUpRight,
              label: "Transactions",
              color: "bg-green-500",
              desc: "Full history",
            },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group cursor-pointer">
                  <div className={`w-11 h-11 ${action.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon size={20} className="text-white" />
                  </div>
                  <p className="font-bold text-[#1a1f36] text-sm">{action.label}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{action.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Active Loan + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Loan */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1a1f36]">Active Loan</h2>
            <Link href="/dashboard/loans" className="text-sm text-blue-600 hover:underline font-medium">
              View all
            </Link>
          </div>
          {activeLoan ? (
            <LoanCard
              loan={{
                ...activeLoan,
                amount: Number(activeLoan.amount),
                interestRate: Number(activeLoan.interestRate),
                monthlyRepayment: Number(activeLoan.monthlyRepayment),
                repayments: activeLoan.repayments.map((r) => ({
                  ...r,
                  amount: Number(r.amount),
                })),
              }}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText size={24} className="text-gray-400" />
              </div>
              <p className="font-semibold text-gray-600">No active loans</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">
                Apply for a loan to get started
              </p>
              <Link href="/dashboard/loans/apply">
                <Button variant="navy" size="sm" className="rounded-full">
                  Apply Now
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1a1f36]">Recent Transactions</h2>
            <Link href="/dashboard/transactions" className="text-sm text-blue-600 hover:underline font-medium">
              View all
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <TransactionList
              transactions={user.transactions.map((t) => ({
                ...t,
                amount: Number(t.amount),
              }))}
              limit={5}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
