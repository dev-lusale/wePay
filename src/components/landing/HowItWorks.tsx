import Link from "next/link";
import { UserPlus, CheckCircle, Banknote, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your Account",
    description:
      "Sign up with your personal details, NRC number, and employment information. Verification takes just minutes.",
    iconColor: "#ea580c",   // orange-600
    accentColor: "#ea580c",
  },
  {
    number: "02",
    icon: CheckCircle,
    title: "Get Verified",
    description:
      "We verify your employment through NAPSA and run a TransUnion credit check to determine your loan eligibility.",
    iconColor: "#1d4ed8",   // blue-700
    accentColor: "#1d4ed8",
  },
  {
    number: "03",
    icon: Banknote,
    title: "Receive Your Funds",
    description:
      "Once approved, funds are disbursed directly to your mobile money or bank account within 24 hours.",
    iconColor: "#047857",   // emerald-700
    accentColor: "#047857",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-700">
            Simple Process
          </span>
          <h2 className="mt-3 text-4xl font-black text-[#1a1f36]">
            How It Works
          </h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">
            Three straightforward steps between you and your funds.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative bg-white rounded-2xl shadow-sm border border-gray-200 p-7 flex flex-col items-start hover:shadow-md transition-shadow duration-200"
                style={{ borderLeftWidth: 4, borderLeftColor: step.accentColor }}
              >
                {/* Step number */}
                <span
                  className="absolute top-5 right-6 text-xs font-black tracking-widest opacity-50"
                  style={{ color: step.accentColor }}
                >
                  {step.number}
                </span>

                {/* Icon box — inline style guarantees colour renders */}
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shadow-md mb-5"
                  style={{ backgroundColor: step.iconColor }}
                >
                  <Icon size={28} color="#ffffff" strokeWidth={1.75} />
                </div>

                {/* Text */}
                <h3 className="text-lg font-bold text-[#1a1f36] mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {step.description}
                </p>

                {/* Connector arrow — desktop only */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm">
                    <ArrowRight size={14} className="text-gray-400" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-14">
          <Link href="/register">
            <Button variant="navy" size="xl" className="group shadow-md rounded-full">
              Start Your Application
              <ArrowRight
                size={18}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </Button>
          </Link>
          <p className="mt-3 text-sm text-gray-400">
            No hidden fees · Transparent rates · Cancel anytime
          </p>
        </div>

      </div>
    </section>
  );
}
