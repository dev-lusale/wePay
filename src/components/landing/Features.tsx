"use client";

import Link from "next/link";
import {
  CreditCard,
  BarChart3,
  Shield,
  Target,
  Zap,
  Clock,
  Users,
  Award,
  Wallet,
  Banknote,
  ArrowRight,
  Smartphone,
  Lock,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── Feature cards ─────────────────────────────────────── */
const features = [
  {
    icon: Zap,
    title: "Easy Payments",
    description:
      "Repay your loan automatically through payroll deductions. No manual transfers, no missed payments.",
    iconColor: "#ea580c",
    borderColor: "#fed7aa",
    bgColor: "#fff7ed",
  },
  {
    icon: BarChart3,
    title: "Smart Tracking",
    description:
      "Monitor your loan balance, repayment schedule, and financial health in real-time from your dashboard.",
    iconColor: "#1d4ed8",
    borderColor: "#bfdbfe",
    bgColor: "#eff6ff",
  },
  {
    icon: Shield,
    title: "Secure & Safe",
    description:
      "Bank-grade encryption and NAPSA verification ensure your data and funds are always protected.",
    iconColor: "#047857",
    borderColor: "#a7f3d0",
    bgColor: "#ecfdf5",
  },
  {
    icon: Target,
    title: "Financial Goals",
    description:
      "Set savings targets, track spending, and build a stronger financial future with personalised insights.",
    iconColor: "#7c3aed",
    borderColor: "#ddd6fe",
    bgColor: "#f5f3ff",
  },
];

/* ─── Services ───────────────────────────────────────────── */
const services = [
  {
    icon: Banknote,
    label: "Salary Loans",
    desc: "Up to 3× your salary",
    color: "#ea580c",
    bg: "rgba(234,88,12,0.12)",
  },
  {
    icon: CreditCard,
    label: "Virtual Card",
    desc: "VISA / Mastercard ready",
    color: "#1d4ed8",
    bg: "rgba(29,78,216,0.12)",
  },
  {
    icon: Wallet,
    label: "Wallet",
    desc: "Store & send money",
    color: "#047857",
    bg: "rgba(4,120,87,0.12)",
  },
  {
    icon: Smartphone,
    label: "Mobile Money",
    desc: "Airtel & MTN linked",
    color: "#7c3aed",
    bg: "rgba(124,58,237,0.12)",
  },
  {
    icon: TrendingUp,
    label: "Credit Builder",
    desc: "Grow your score",
    color: "#0891b2",
    bg: "rgba(8,145,178,0.12)",
  },
  {
    icon: Lock,
    label: "Secure Vault",
    desc: "256-bit encryption",
    color: "#be185d",
    bg: "rgba(190,24,93,0.12)",
  },
];

/* ─── All-in-one bullets ─────────────────────────────────── */
const bullets = [
  { icon: Clock,  title: "Instant Approval",  desc: "Approved in minutes, not days" },
  { icon: CreditCard, title: "No Collateral", desc: "Your salary is your security" },
  { icon: Users,  title: "Employer Network",  desc: "500+ partner employers in Zambia" },
  { icon: Award,  title: "Credit Building",   desc: "Improve your TransUnion score" },
];

export function Features() {
  return (
    <>
      {/* ── Why WePay cards ─────────────────────────────────── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
              Why WePay
            </span>
            <h2 className="mt-2 text-4xl font-black text-[#1a1f36]">
              Built for Zambian workers
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto">
              We understand the financial needs of employed Zambians. WePay is designed
              to make borrowing simple, transparent, and affordable.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="bg-white rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
                  style={{ border: `1px solid ${f.borderColor}` }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: f.bgColor }}
                  >
                    <Icon size={22} style={{ color: f.iconColor }} />
                  </div>
                  <h3 className="font-bold text-[#1a1f36] text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Services + All-in-one ────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-[#0f1629] via-[#1a1f36] to-[#0f1629] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: copy + bullets */}
            <div>
              <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
                All-in-One Platform
              </span>
              <h2 className="mt-3 text-4xl font-black leading-tight">
                Everything you need,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
                  All in one place
                </span>
              </h2>
              <p className="mt-4 text-gray-300 leading-relaxed max-w-md">
                From loan application to virtual card payments, WePay handles
                everything. Connect your employer, verify your NAPSA number, and
                access funds within 24 hours.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {bullets.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start space-x-3">
                    <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={16} className="text-orange-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{title}</p>
                      <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Link href="/register">
                  <Button
                    size="xl"
                    className="rounded-full font-bold shadow-lg bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Get Started Free
                    <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Services module — glassmorphism grid */}
            <div className="relative">
              {/* Glow blobs */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-10 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

              {/* Glass container */}
              <div
                className="relative rounded-3xl p-6 border"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(20px)",
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-widest font-semibold">
                      WePay Services
                    </p>
                    <p className="text-lg font-black mt-0.5">Financial Suite</p>
                  </div>
                  <div className="flex space-x-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                    <div className="w-3 h-3 rounded-full bg-green-400/70" />
                  </div>
                </div>

                {/* Service grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {services.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.label}
                        className="group flex flex-col items-center text-center p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:scale-105"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110"
                          style={{ backgroundColor: s.bg }}
                        >
                          <Icon size={20} style={{ color: s.color }} />
                        </div>
                        <p className="text-xs font-bold text-white leading-tight">
                          {s.label}
                        </p>
                        <p className="text-[10px] text-white/40 mt-0.5 leading-tight">
                          {s.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Mini virtual card preview */}
                <div
                  className="relative rounded-2xl p-5 overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #1d4ed8 0%, #7c3aed 50%, #be185d 100%)",
                  }}
                >
                  {/* Card shine */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-white/60 text-xs">Virtual Card</p>
                        <p className="text-white font-black text-lg">WePay Card</p>
                      </div>
                      {/* Mastercard circles */}
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-red-500/80" />
                        <div className="w-8 h-8 rounded-full bg-yellow-400/80" />
                      </div>
                    </div>

                    <p className="text-white/80 font-mono text-sm tracking-widest mb-3">
                      •••• •••• •••• 4291
                    </p>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/50 text-[10px] uppercase">Balance</p>
                        <p className="text-white font-bold text-sm">ZMW 5,000.00</p>
                      </div>
                      <div>
                        <p className="text-white/50 text-[10px] uppercase">Expires</p>
                        <p className="text-white font-bold text-sm">12/28</p>
                      </div>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.15)" }}
                      >
                        <Wifi size={14} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick stats row */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[
                    { label: "Transactions", value: "128" },
                    { label: "Saved", value: "ZMW 2.4K" },
                    { label: "Score", value: "742" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="text-center p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <p className="text-white font-black text-sm">{s.value}</p>
                      <p className="text-white/40 text-[10px] mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// Need Wifi icon — add it
function Wifi({ size, className }: { size: number; className?: string }) {
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
