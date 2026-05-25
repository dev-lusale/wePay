import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">

      {/* ── Background image — full section on ALL screen sizes ── */}
      <div className="absolute inset-0">
        <Image
          src="/background.jpeg"
          alt="WePay — Smarter Payments, Better Life"
          fill
          className="object-cover object-top"
          priority
          sizes="100vw"
        />

        {/* Mobile overlay: heavy gradient from bottom so text is readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/85 to-white/40 lg:hidden" />

        {/* Desktop overlay: gradient from left so right side shows the lady */}
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-white via-white/80 to-transparent" />

        {/* Warm golden glow top-right (matches mockup light burst) */}
        <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-gradient-to-bl from-yellow-200/40 via-transparent to-transparent" />
      </div>

      {/* ── Content ── */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Left / centre on mobile: Text */}
          <div className="space-y-7 animate-fade-in">

        

            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl font-black text-[#1a1f36] leading-tight">
              Drawing your
              <br />
              needs closer
              <br />
              to your{" "}
              <span className=" bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">
                Salary.
              </span>
            </h1>

            {/* Subtext */}
            <p className="text-lg text-gray-600 leading-relaxed max-w-lg">
              WePay helps you manage your money smarter, pay with ease, and achieve
              more of what matters to you.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link href="/register">
                <Button variant="navy" size="xl" className="group shadow-lg rounded-full">
                  Create Account
                  <ArrowRight
                    size={18}
                    className="ml-2 group-hover:translate-x-1 transition-transform"
                  />
                </Button>
              </Link>
              <button className="flex items-center space-x-3 group">
                <div className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center group-hover:shadow-lg transition-shadow border border-gray-100">
                  <Play size={16} className="text-[#1a1f36] ml-0.5" fill="currentColor" />
                </div>
                <span className="font-semibold text-[#1a1f36]">Watch Video</span>
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-2">
              {[
                { value: "0+", label: "Active Borrowers" },
                { value: "ZMW 0M+", label: "Disbursed" },
                { value: "0.0★", label: "App Rating" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-bold text-[#1a1f36]">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: floating cards — desktop only */}
          <div className="relative hidden lg:flex items-end justify-start pl-8 pb-8 min-h-[480px]">

            {/* "More control. More freedom." card */}
            <div className="absolute bottom-8 left-0 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 border border-gray-100 z-20 max-w-[240px]">
              <div className="flex items-center space-x-3">
                
                <div>
                  <p className="text-sm font-bold text-[#1a1f36]">More control.</p>
                  <p className="text-sm font-bold text-[#1a1f36]">More freedom.</p>
                  <p className="text-xs">
                    All in{" "}
                    <span className="font-black">
                      <span className="text-red-500">W</span>
                      <span className="text-blue-500">e</span>
                      <span className="text-green-500">P</span>
                      <span className="text-orange-500">a</span>
                      <span className="text-purple-500">y</span>
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Loan approved notification */}
            <div className="absolute top-8 right-0 bg-white rounded-2xl shadow-xl p-3 border border-gray-100 z-20">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-sm font-bold">✓</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#1a1f36]">Loan Approved!</p>
                  <p className="text-xs text-gray-500">ZMW 0,000 disbursed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
