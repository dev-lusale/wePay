import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LoanData } from "@/types";

interface LoanCardProps {
  loan: LoanData;
}

const statusConfig = {
  PENDING: { label: "Pending Review", variant: "warning" as const },
  APPROVED: { label: "Approved", variant: "info" as const },
  ACTIVE: { label: "Active", variant: "success" as const },
  COMPLETED: { label: "Completed", variant: "secondary" as const },
  DEFAULTED: { label: "Defaulted", variant: "destructive" as const },
};

export function LoanCard({ loan }: LoanCardProps) {
  const config = statusConfig[loan.status];
  const paidRepayments = loan.repayments?.filter((r) => r.status === "PAID").length ?? 0;
  const totalRepayments = loan.repayments?.length ?? loan.termMonths;
  const progress = totalRepayments > 0 ? (paidRepayments / totalRepayments) * 100 : 0;
  const remainingAmount = loan.amount - (paidRepayments * loan.monthlyRepayment);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">Loan Amount</p>
          <p className="text-2xl font-black text-[#1a1f36]">
            {formatCurrency(loan.amount)}
          </p>
        </div>
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500">Monthly</p>
          <p className="font-bold text-[#1a1f36] text-sm">
            {formatCurrency(loan.monthlyRepayment)}
          </p>
        </div>
        <div className="text-center bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500">Term</p>
          <p className="font-bold text-[#1a1f36] text-sm">{loan.termMonths} months</p>
        </div>
        <div className="text-center bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500">Rate</p>
          <p className="font-bold text-[#1a1f36] text-sm">{loan.interestRate}% p.a.</p>
        </div>
      </div>

      {loan.status === "ACTIVE" && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
            <span>Repayment Progress</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{paidRepayments} paid</span>
            <span>{totalRepayments - paidRepayments} remaining</span>
          </div>
        </div>
      )}

      {loan.disbursedAt && (
        <div className="flex items-center text-xs text-gray-500 mb-4">
          <Calendar size={12} className="mr-1" />
          Disbursed {formatDate(loan.disbursedAt)}
        </div>
      )}

      <Link href="/dashboard/loans">
        <Button variant="outline" size="sm" className="w-full rounded-xl group">
          View Details
          <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
      </Link>
    </div>
  );
}
