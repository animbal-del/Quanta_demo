"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Inbox, Clock, Users, BarChart2, Zap, LogOut, LayoutGrid } from "lucide-react";

const NAV = [
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
      <aside className="w-52 shrink-0 bg-white border-r border-gray-100 flex flex-col">
        {/* Logo */}
        <div className="h-13 flex items-center gap-2.5 px-4 py-3.5 border-b border-gray-100">
          <div className="w-6 h-6 rounded bg-gray-950 flex items-center justify-center shrink-0">
            <Zap size={12} className="text-white" />
          </div>
          <span className="font-semibold text-gray-950 text-sm tracking-tight">Quanta Scout</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-gray-950 text-white font-medium"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-gray-900">Quanta Team</p>
            <p className="text-xs text-gray-400 truncate">team@quanta.vc</p>
          </div>
          <Link href="/scout" className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Scout Portal
          </Link>
          <Link href="/" className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <LogOut size={11} />
            Sign out
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
