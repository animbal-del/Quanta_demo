"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Inbox,
  Clock,
  Users,
  BarChart2,
  Zap,
  LogOut,
  LayoutGrid,
} from "lucide-react";

const nav = [
  { label: "Command Center", href: "/inbox", icon: Inbox },
  { label: "Applications", href: "/deals", icon: LayoutGrid },
  { label: "Follow-up Queue", href: "/queue", icon: Clock },
  { label: "Scouts", href: "/scouts", icon: Users },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2 px-4 border-b border-gray-200">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-sm">Quanta Scout OS</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5">
          {nav.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Scout Portal link */}
        <div className="p-3 border-t border-gray-200">
          <div className="mb-2 rounded-lg bg-gray-50 px-3 py-2">
            <p className="text-xs font-medium text-gray-900">Quanta Team</p>
            <p className="text-xs text-gray-400">team@quanta.vc</p>
          </div>
          <Link
            href="/scout"
            className="flex items-center gap-2 text-xs text-gray-500 hover:text-indigo-600 transition-colors px-2 py-1.5 rounded"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Scout Portal
          </Link>
          <Link
            href="/"
            className="mt-1 flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 transition-colors px-2 py-1.5 rounded"
          >
            <LogOut size={12} />
            Switch login
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
