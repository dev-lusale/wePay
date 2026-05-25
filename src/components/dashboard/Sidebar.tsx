"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  CreditCard,
  ArrowLeftRight,
  User,
  LogOut,
  X,
  PlusCircle,
  Wallet,
} from "lucide-react";
import { WePayLogo } from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",              label: "Dashboard",      icon: LayoutDashboard },
  { href: "/dashboard/card",         label: "Virtual Card",   icon: Wallet },
  { href: "/dashboard/loans",        label: "My Loans",       icon: CreditCard },
  { href: "/dashboard/loans/apply",  label: "Apply for Loan", icon: PlusCircle },
  { href: "/dashboard/transactions", label: "Transactions",   icon: ArrowLeftRight },
  { href: "/dashboard/profile",      label: "Profile",        icon: User },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-[#1a1f36] text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <Link href="/dashboard">
          <WePayLogo size="md" />
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md hover:bg-white/10"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon
                size={18}
                className={isActive ? "text-orange-400" : "text-white/50"}
              />
              <span>{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-orange-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Sign Out */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-all w-full"
        >
          <LogOut size={18} className="text-white/50" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
