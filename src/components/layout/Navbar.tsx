"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WePayLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-xl", md: "text-2xl", lg: "text-4xl" };
  return (
    <span className={`font-black ${sizes[size]} tracking-tight`}>
      <span className="text-red-500">W</span>
      <span className="text-blue-500">e</span>
      <span className="text-green-500">P</span>
      <span className="text-orange-500">a</span>
      <span className="text-purple-500">y</span>
    </span>
  );
}

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "About Us", href: "/#about" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <WePayLogo />
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-gray-600 hover:text-[#1a1f36] font-medium text-sm transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {session ? (
              <div className="flex items-center space-x-3">
                <Link href="/dashboard">
                  <Button variant="navy" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm text-gray-600 hover:text-[#1a1f36] font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-gray-700 font-medium">
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="navy" size="sm" className="rounded-full">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-[#1a1f36] hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block text-gray-700 hover:text-[#1a1f36] font-medium py-2 border-b border-gray-50"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 flex flex-col space-y-2">
              {session ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="navy" className="w-full rounded-full">
                      Dashboard
                    </Button>
                  </Link>
                  <button
                    onClick={() => { signOut({ callbackUrl: "/" }); setMobileOpen(false); }}
                    className="text-sm text-gray-600 font-medium py-2"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full rounded-full">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    <Button variant="navy" className="w-full rounded-full">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
