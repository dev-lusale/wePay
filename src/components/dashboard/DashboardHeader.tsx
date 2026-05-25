"use client";

import { useState } from "react";
import { Menu, Bell, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { Sidebar } from "./Sidebar";

interface DashboardHeaderProps {
  title?: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <>
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Hamburger + Title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          {title && (
            <h1 className="text-lg font-bold text-[#1a1f36] hidden sm:block">
              {title}
            </h1>
          )}
        </div>

        {/* Right: Search + Notifications + Avatar */}
        <div className="flex items-center space-x-3">
          <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hidden sm:flex">
            <Search size={18} />
          </button>
          <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
          </button>
          <div className="w-9 h-9 bg-[#1a1f36] rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {session?.user?.name?.charAt(0) ?? "U"}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 animate-slide-in">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}
