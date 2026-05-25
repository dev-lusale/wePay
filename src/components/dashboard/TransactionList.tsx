import { ArrowDownLeft, ArrowUpRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { TransactionData } from "@/types";

interface TransactionListProps {
  transactions: TransactionData[];
  limit?: number;
}

const typeConfig = {
  DISBURSEMENT: {
    label: "Loan Disbursed",
    icon: ArrowDownLeft,
    color: "text-green-600",
    bg: "bg-green-100",
    sign: "+",
    badgeVariant: "success" as const,
  },
  REPAYMENT: {
    label: "Repayment",
    icon: ArrowUpRight,
    color: "text-red-500",
    bg: "bg-red-100",
    sign: "-",
    badgeVariant: "destructive" as const,
  },
  FEE: {
    label: "Fee",
    icon: Minus,
    color: "text-orange-600",
    bg: "bg-orange-100",
    sign: "-",
    badgeVariant: "warning" as const,
  },
};

export function TransactionList({ transactions, limit }: TransactionListProps) {
  const displayed = limit ? transactions.slice(0, limit) : transactions;

  if (displayed.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <ArrowDownLeft size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">No transactions yet</p>
        <p className="text-sm mt-1">Your transaction history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayed.map((tx) => {
        const config = typeConfig[tx.type];
        const Icon = config.icon;
        return (
          <div
            key={tx.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={config.color} />
              </div>
              <div>
                <p className="font-semibold text-[#1a1f36] text-sm">{tx.description}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDateTime(tx.createdAt)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold text-sm ${config.color}`}>
                {config.sign}{formatCurrency(tx.amount)}
              </p>
              <Badge variant={config.badgeVariant} className="text-xs mt-1">
                {config.label}
              </Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}
