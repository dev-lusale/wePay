"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Calculator, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency, calculateMonthlyRepayment } from "@/lib/utils";

const INTEREST_RATE = 18; // 18% per annum

const loanSchema = z.object({
  amount: z.number().min(500, "Minimum loan amount is ZMW 500"),
  termMonths: z.number().min(1).max(36),
});

type LoanFormData = z.infer<typeof loanSchema>;

const termOptions = [3, 6, 9, 12, 18, 24, 36];

export default function ApplyLoanPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [maxLoan, setMaxLoan] = useState(15000);
  const [loanAmount, setLoanAmount] = useState(5000);
  const [termMonths, setTermMonths] = useState(12);

  const monthlyRepayment = calculateMonthlyRepayment(loanAmount, INTEREST_RATE, termMonths);
  const totalRepayment = monthlyRepayment * termMonths;
  const totalInterest = totalRepayment - loanAmount;

  useEffect(() => {
    // Fetch user's max loan amount
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.employmentProfile?.monthlySalary) {
          setMaxLoan(Number(data.employmentProfile.monthlySalary) * 3);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: loanAmount, termMonths }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to submit loan application");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/loans"), 2000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-black text-[#1a1f36] mb-3">
            Application Submitted!
          </h2>
          <p className="text-gray-600 mb-2">
            Your loan application for{" "}
            <strong>{formatCurrency(loanAmount)}</strong> has been submitted
            successfully.
          </p>
          <p className="text-gray-500 text-sm">
            We&apos;ll review your application and notify you within 1-2 business days.
            Redirecting to your loans...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/loans">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft size={18} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#1a1f36]">Apply for a Loan</h1>
          <p className="text-gray-500 text-sm">
            Choose your loan amount and repayment period
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start space-x-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Loan Amount Slider */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-[#1a1f36] font-bold text-base">
              Loan Amount
            </Label>
            <div className="bg-[#1a1f36] text-white rounded-xl px-4 py-2">
              <span className="text-lg font-black">{formatCurrency(loanAmount)}</span>
            </div>
          </div>

          <input
            type="range"
            min={500}
            max={maxLoan}
            step={500}
            value={loanAmount}
            onChange={(e) => setLoanAmount(Number(e.target.value))}
            className="w-full accent-[#1a1f36]"
            style={{
              background: `linear-gradient(to right, #1a1f36 ${((loanAmount - 500) / (maxLoan - 500)) * 100}%, #e2e8f0 ${((loanAmount - 500) / (maxLoan - 500)) * 100}%)`,
            }}
          />

          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>ZMW 500</span>
            <span>Max: {formatCurrency(maxLoan)}</span>
          </div>

          {/* Quick amount buttons */}
          <div className="flex flex-wrap gap-2 mt-4">
            {[1000, 2500, 5000, 10000, 15000].filter((a) => a <= maxLoan).map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => setLoanAmount(amount)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  loanAmount === amount
                    ? "bg-[#1a1f36] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>
        </div>

        {/* Repayment Period */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <Label className="text-[#1a1f36] font-bold text-base mb-4 block">
            Repayment Period
          </Label>
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-2">
            {termOptions.map((months) => (
              <button
                key={months}
                type="button"
                onClick={() => setTermMonths(months)}
                className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                  termMonths === months
                    ? "bg-[#1a1f36] text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {months}m
              </button>
            ))}
          </div>
        </div>

        {/* Loan Summary */}
        <div className="bg-gradient-to-br from-[#1a1f36] to-[#2d3561] rounded-2xl p-6 text-white">
          <div className="flex items-center space-x-2 mb-4">
            <Calculator size={18} className="text-orange-400" />
            <h3 className="font-bold">Loan Summary</h3>
          </div>

          <div className="space-y-3">
            {[
              { label: "Loan Amount", value: formatCurrency(loanAmount) },
              { label: "Interest Rate", value: `${INTEREST_RATE}% per annum` },
              { label: "Repayment Period", value: `${termMonths} months` },
              { label: "Monthly Repayment", value: formatCurrency(monthlyRepayment), highlight: true },
              { label: "Total Interest", value: formatCurrency(totalInterest) },
              { label: "Total Repayment", value: formatCurrency(totalRepayment), highlight: true },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex justify-between items-center ${
                  item.highlight ? "bg-white/10 rounded-xl px-3 py-2" : ""
                }`}
              >
                <span className="text-white/70 text-sm">{item.label}</span>
                <span className={`font-bold ${item.highlight ? "text-orange-400 text-lg" : "text-sm"}`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-blue-800 text-xs leading-relaxed">
            <strong>Important:</strong> By submitting this application, you agree that
            repayments will be deducted from your salary each month. Ensure your employer
            is registered with WePay before applying. Late payments may affect your credit score.
          </p>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="navy"
          size="xl"
          className="w-full rounded-xl"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Submitting Application...
            </>
          ) : (
            `Apply for ${formatCurrency(loanAmount)}`
          )}
        </Button>
      </form>
    </div>
  );
}
