"use client";

import { useState } from "react";
import {
  CreditCard,
  Eye,
  EyeOff,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Lock,
  Unlock,
  RefreshCw,
  ShoppingBag,
  Utensils,
  Fuel,
  Wifi,
  MoreHorizontal,
  CheckCircle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ─── Mock data ─────────────────────────────────────────── */
const cards = [
  {
    id: "1",
    label: "WePay Visa",
    number: "4291 •••• •••• 8847",
    fullNumber: "4291 5523 7741 8847",
    expiry: "09/27",
    cvv: "•••",
    fullCvv: "392",
    balance: 5240.0,
    currency: "ZMW",
    type: "VISA",
    gradient: "linear-gradient(135deg, #1a1f36 0%, #2d3561 50%, #1a1f36 100%)",
    active: true,
  },
  {
    id: "2",
    label: "WePay Mastercard",
    number: "5412 •••• •••• 3301",
    fullNumber: "5412 8834 9921 3301",
    expiry: "12/28",
    cvv: "•••",
    fullCvv: "741",
    balance: 1800.5,
    currency: "ZMW",
    type: "MC",
    gradient: "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 60%, #be185d 100%)",
    active: true,
  },
];

const transactions = [
  { id: "1", merchant: "Shoprite Lusaka",   category: "shopping", amount: -320.0,  date: "Today, 10:42 AM",    status: "completed" },
  { id: "2", merchant: "Salary Credit",     category: "income",   amount: +8500.0, date: "Today, 08:00 AM",    status: "completed" },
  { id: "3", merchant: "KFC Manda Hill",    category: "food",     amount: -185.0,  date: "Yesterday, 1:15 PM", status: "completed" },
  { id: "4", merchant: "Total Energies",    category: "fuel",     amount: -450.0,  date: "Yesterday, 9:30 AM", status: "completed" },
  { id: "5", merchant: "Netflix",           category: "wifi",     amount: -89.0,   date: "May 22, 6:00 PM",    status: "completed" },
  { id: "6", merchant: "Loan Repayment",    category: "transfer", amount: -1250.0, date: "May 21, 8:00 AM",    status: "completed" },
  { id: "7", merchant: "Pick n Pay",        category: "shopping", amount: -210.0,  date: "May 20, 3:45 PM",    status: "completed" },
  { id: "8", merchant: "Fund Transfer In",  category: "income",   amount: +2000.0, date: "May 19, 11:00 AM",   status: "completed" },
];

const categoryIcon: Record<string, React.ReactNode> = {
  shopping: <ShoppingBag size={16} />,
  food:     <Utensils size={16} />,
  fuel:     <Fuel size={16} />,
  wifi:     <WifiIcon size={16} />,
  income:   <ArrowDownLeft size={16} />,
  transfer: <ArrowUpRight size={16} />,
};

const categoryColor: Record<string, string> = {
  shopping: "#ea580c",
  food:     "#7c3aed",
  fuel:     "#047857",
  wifi:     "#0891b2",
  income:   "#16a34a",
  transfer: "#dc2626",
};

/* ─── Component ─────────────────────────────────────────── */
export default function VirtualCardPage() {
  const [activeCard, setActiveCard]     = useState(0);
  const [showDetails, setShowDetails]   = useState(false);
  const [cardLocked, setCardLocked]     = useState(false);
  const [copied, setCopied]             = useState(false);
  const [showFund, setShowFund]         = useState(false);
  const [fundAmount, setFundAmount]     = useState("");
  const [fundSuccess, setFundSuccess]   = useState(false);

  const card = cards[activeCard];

  function copyNumber() {
    navigator.clipboard.writeText(card.fullNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleFund() {
    if (!fundAmount || isNaN(Number(fundAmount))) return;
    setFundSuccess(true);
    setTimeout(() => {
      setFundSuccess(false);
      setShowFund(false);
      setFundAmount("");
    }, 2000);
  }

  const totalIn  = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#1a1f36]">Virtual Cards</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage your VISA &amp; Mastercard virtual cards
          </p>
        </div>
        <Button
          variant="navy"
          className="rounded-full hidden sm:flex"
          onClick={() => setShowFund(true)}
        >
          <Plus size={16} className="mr-2" />
          Fund Card
        </Button>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">

        {/* ── Left column: card + controls ────────────────── */}
        <div className="lg:col-span-3 space-y-5">

          {/* Card selector tabs */}
          <div className="flex space-x-2">
            {cards.map((c, i) => (
              <button
                key={c.id}
                onClick={() => { setActiveCard(i); setShowDetails(false); }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeCard === i
                    ? "bg-[#1a1f36] text-white shadow-md"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                {c.type === "VISA" ? "💳 Visa" : "💳 Mastercard"}
              </button>
            ))}
          </div>

          {/* ── The card itself ──────────────────────────── */}
          <div className="relative select-none">
            <div
              className="relative rounded-3xl p-7 overflow-hidden shadow-2xl transition-all duration-500"
              style={{
                background: cardLocked
                  ? "linear-gradient(135deg, #374151 0%, #1f2937 100%)"
                  : card.gradient,
                minHeight: 200,
              }}
            >
              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
              <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-white/5 rounded-full" />

              {/* Chip + network */}
              <div className="relative z-10 flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {/* SIM chip */}
                  <div className="w-10 h-8 rounded-md bg-yellow-300/80 flex items-center justify-center">
                    <div className="w-6 h-5 rounded-sm border-2 border-yellow-600/50 grid grid-cols-2 gap-0.5 p-0.5">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-yellow-600/40 rounded-[1px]" />
                      ))}
                    </div>
                  </div>
                  <WifiIcon size={18} className="text-white/60 rotate-90" />
                </div>

                {/* Network logo */}
                {card.type === "VISA" ? (
                  <span className="text-white font-black text-2xl italic tracking-tight">
                    VISA
                  </span>
                ) : (
                  <div className="flex -space-x-2">
                    <div className="w-9 h-9 rounded-full bg-red-500/90" />
                    <div className="w-9 h-9 rounded-full bg-yellow-400/90" />
                  </div>
                )}
              </div>

              {/* Card number */}
              <div className="relative z-10 mb-5">
                <p className="text-white/50 text-xs uppercase tracking-widest mb-1">
                  Card Number
                </p>
                <p className="text-white font-mono text-lg tracking-widest">
                  {showDetails ? card.fullNumber : card.number}
                </p>
              </div>

              {/* Bottom row */}
              <div className="relative z-10 flex items-end justify-between">
                <div>
                  <p className="text-white/50 text-[10px] uppercase tracking-widest">
                    Card Holder
                  </p>
                  <p className="text-white font-bold text-sm mt-0.5">
                    {card.label}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-white/50 text-[10px] uppercase tracking-widest">
                    Expires
                  </p>
                  <p className="text-white font-bold text-sm mt-0.5">{card.expiry}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/50 text-[10px] uppercase tracking-widest">
                    CVV
                  </p>
                  <p className="text-white font-bold text-sm mt-0.5 font-mono">
                    {showDetails ? card.fullCvv : card.cvv}
                  </p>
                </div>
              </div>

              {/* Locked overlay */}
              {cardLocked && (
                <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center z-20 backdrop-blur-sm">
                  <div className="text-center">
                    <Lock size={36} className="text-white mx-auto mb-2" />
                    <p className="text-white font-bold">Card Locked</p>
                    <p className="text-white/60 text-xs mt-1">
                      Tap unlock to resume
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Balance pill floating below card */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-full px-5 py-2 shadow-lg border border-gray-100 flex items-center space-x-2 whitespace-nowrap">
              <span className="text-xs text-gray-500">Balance</span>
              <span className="font-black text-[#1a1f36]">
                ZMW {card.balance.toLocaleString("en-ZM", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Spacer for the floating pill */}
          <div className="h-4" />

          {/* ── Card action buttons ──────────────────────── */}
          <div className="grid grid-cols-4 gap-3">
            {[
              {
                icon: showDetails ? EyeOff : Eye,
                label: showDetails ? "Hide" : "Reveal",
                action: () => setShowDetails(!showDetails),
                color: "#1d4ed8",
                bg: "#eff6ff",
              },
              {
                icon: copied ? CheckCircle : Copy,
                label: copied ? "Copied!" : "Copy",
                action: copyNumber,
                color: "#047857",
                bg: "#ecfdf5",
              },
              {
                icon: cardLocked ? Unlock : Lock,
                label: cardLocked ? "Unlock" : "Lock",
                action: () => setCardLocked(!cardLocked),
                color: cardLocked ? "#ea580c" : "#7c3aed",
                bg: cardLocked ? "#fff7ed" : "#f5f3ff",
              },
              {
                icon: RefreshCw,
                label: "Refresh",
                action: () => {},
                color: "#0891b2",
                bg: "#ecfeff",
              },
            ].map(({ icon: Icon, label, action, color, bg }) => (
              <button
                key={label}
                onClick={action}
                className="flex flex-col items-center py-4 rounded-2xl border border-gray-100 bg-white hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: bg }}
                >
                  <Icon size={18} style={{ color }} />
                </div>
                <span className="text-xs font-semibold text-gray-600">{label}</span>
              </button>
            ))}
          </div>

          {/* ── Spending summary ─────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-green-700">Money In</p>
                <ArrowDownLeft size={16} style={{ color: "#16a34a" }} />
              </div>
              <p className="text-2xl font-black text-green-800">
                +ZMW {totalIn.toLocaleString("en-ZM", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-green-600 mt-1">This month</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-red-700">Money Out</p>
                <ArrowUpRight size={16} style={{ color: "#dc2626" }} />
              </div>
              <p className="text-2xl font-black text-red-800">
                -ZMW {totalOut.toLocaleString("en-ZM", { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-red-600 mt-1">This month</p>
            </div>
          </div>
        </div>

        {/* ── Right column: transactions ───────────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden h-full">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-[#1a1f36]">Transactions</h2>
              <Badge variant="secondary" className="text-xs">
                {transactions.length} total
              </Badge>
            </div>

            <div className="divide-y divide-gray-50 overflow-y-auto max-h-[520px]">
              {transactions.map((tx) => {
                const isCredit = tx.amount > 0;
                const icon = categoryIcon[tx.category] ?? <MoreHorizontal size={16} />;
                const color = categoryColor[tx.category] ?? "#6b7280";
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: `${color}18`,
                          color,
                        }}
                      >
                        {icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1a1f36] leading-tight">
                          {tx.merchant}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{tx.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm font-bold"
                        style={{ color: isCredit ? "#16a34a" : "#dc2626" }}
                      >
                        {isCredit ? "+" : ""}
                        ZMW {Math.abs(tx.amount).toLocaleString("en-ZM", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 capitalize">
                        {tx.status}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Fund Card Modal ──────────────────────────────────── */}
      {showFund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFund(false)}
          />

          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 z-10">
            {/* Close */}
            <button
              onClick={() => setShowFund(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <X size={16} className="text-gray-500" />
            </button>

            {fundSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-black text-[#1a1f36]">Funded!</h3>
                <p className="text-gray-500 text-sm mt-2">
                  ZMW {Number(fundAmount).toLocaleString()} added to your card
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <CreditCard size={26} className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-black text-[#1a1f36]">Fund Card</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    Add money to {card.label}
                  </p>
                </div>

                {/* Quick amounts */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[500, 1000, 2500, 5000, 10000, 20000].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setFundAmount(String(amt))}
                      className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                        fundAmount === String(amt)
                          ? "bg-[#1a1f36] text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {amt >= 1000 ? `${amt / 1000}K` : amt}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="relative mb-5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">
                    ZMW
                  </span>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-[#1a1f36] focus:ring-2 focus:ring-[#1a1f36]/10 outline-none text-[#1a1f36] font-bold text-lg"
                  />
                </div>

                <Button
                  variant="navy"
                  size="xl"
                  className="w-full rounded-xl"
                  onClick={handleFund}
                  disabled={!fundAmount || isNaN(Number(fundAmount))}
                >
                  Fund Card
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* Inline Wifi SVG to avoid import issues */
function WifiIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  );
}
