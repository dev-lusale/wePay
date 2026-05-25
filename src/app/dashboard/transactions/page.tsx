import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, Minus, TrendingDown, TrendingUp } from "lucide-react";

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const totalDisbursed = transactions
    .filter((t) => t.type === "DISBURSEMENT")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalRepaid = transactions
    .filter((t) => t.type === "REPAYMENT")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalFees = transactions
    .filter((t) => t.type === "FEE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const typedTransactions = transactions.map((t) => ({
    ...t,
    amount: Number(t.amount),
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#1a1f36]">Transaction History</h1>
        <p className="text-gray-500 text-sm mt-1">
          All your financial activity in one place
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-green-700 font-medium">Total Disbursed</p>
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
              <ArrowDownLeft size={18} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-green-800">
            {formatCurrency(totalDisbursed)}
          </p>
          <p className="text-xs text-green-600 mt-1">
            {transactions.filter((t) => t.type === "DISBURSEMENT").length} disbursements
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-red-700 font-medium">Total Repaid</p>
            <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center">
              <ArrowUpRight size={18} className="text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-800">
            {formatCurrency(totalRepaid)}
          </p>
          <p className="text-xs text-red-600 mt-1">
            {transactions.filter((t) => t.type === "REPAYMENT").length} repayments
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-orange-700 font-medium">Total Fees</p>
            <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center">
              <Minus size={18} className="text-orange-600" />
            </div>
          </div>
          <p className="text-2xl font-black text-orange-800">
            {formatCurrency(totalFees)}
          </p>
          <p className="text-xs text-orange-600 mt-1">
            {transactions.filter((t) => t.type === "FEE").length} fee charges
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-[#1a1f36]">
            All Transactions ({transactions.length})
          </h2>
          <div className="flex items-center space-x-2">
            <Badge variant="default" className="cursor-pointer">All</Badge>
            <Badge variant="outline" className="cursor-pointer">Disbursements</Badge>
            <Badge variant="outline" className="cursor-pointer">Repayments</Badge>
          </div>
        </div>

        <TransactionList transactions={typedTransactions} />
      </div>
    </div>
  );
}
