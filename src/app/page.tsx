import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Testimonials } from "@/components/landing/Testimonials";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <Testimonials />

        {/* CTA Banner */}
        <section className="py-20 bg-gradient-to-r from-orange-500 to-orange-600">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-black text-white mb-4">
              Ready to take control of your finances?
            </h2>
            <p className="text-orange-100 text-lg mb-8 max-w-xl mx-auto">
              Join over 10,000 Zambians who trust WePay for their salary-backed
              lending needs. Apply today — it takes less than 5 minutes.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/register">
                <Button
                  size="xl"
                  className="bg-white text-orange-600 hover:bg-orange-50 rounded-full font-bold shadow-lg"
                >
                  Create Free Account
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="xl"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 rounded-full font-bold"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
