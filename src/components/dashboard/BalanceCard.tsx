"use client";

import { TrendingUp, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface BalanceCardProps {
  balance: number;
  availableCredit: number;
  monthlySalary: number;
}

export function BalanceCard({ balance, availableCredit, monthlySalary }: BalanceCardProps) {
  const [showBalance, setShowBalance] = useState(true);

  return (
    <div className="bg-gradient-to-br from-[#1a1f36] to-[#2d3561] rounded-3xl p-6 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/60 text-sm font-medium">Account Balance</p>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-3xl font-black">
                {showBalance ? formatCurrency(balance) : "ZMW ••••••"}
              </p>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-white/50 hover:text-white transition-colors"
                aria-label={showBalance ? "Hide balance" : "Show balance"}
              >
                {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
            <TrendingUp size={22} className="text-green-400" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 rounded-2xl p-4">
            <p className="text-white/60 text-xs mb-1">Available Credit</p>
            <p className="text-lg font-bold text-green-400">
              {showBalance ? formatCurrency(availableCredit) : "••••"}
            </p>
          </div>
          <div className="bg-white/10 rounded-2xl p-4">
            <p className="text-white/60 text-xs mb-1">Monthly Salary</p>
            <p className="text-lg font-bold text-blue-300">
              {showBalance ? formatCurrency(monthlySalary) : "••••"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
