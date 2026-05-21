"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Inbox, Clock, Users, BarChart2, Zap, LogOut, LayoutGrid, User, Loader2 } from "lucide-react";

const NAV = [
  { label: "Command Center", href: "/inbox", icon: Inbox },
  { label: "Applications", href: "/deals", icon: LayoutGrid },
  { label: "Follow-up Queue", href: "/queue", icon: Clock },
  { label: "Scouts", href: "/scouts", icon: Users },
  { label: "Analytics", href: "/analytics", icon: BarChart2 },
];

interface Session {
  display_name: string; email: string | null; is_demo: boolean; role: string | null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session").then((r) => r.json()).then(setSession);
  }, []);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

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
                  active ? "bg-gray-950 text-white font-medium" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}>
                <Icon size={14} />{label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          {session && (
            <Link href="/profile"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group ${
                pathname === "/profile" ? "bg-gray-100" : ""
              }`}>
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                {session.display_name?.charAt(0) ?? "Q"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-900 truncate">{session.display_name}</p>
                <p className="text-[10px] text-gray-400 truncate">{session.email ?? "Demo"}</p>
              </div>
              <User size={11} className="text-gray-300 group-hover:text-gray-500 shrink-0" />
            </Link>
          )}

          <Link href="/scout"
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Scout Portal
          </Link>

          <button onClick={logout} disabled={loggingOut}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            {loggingOut ? <Loader2 size={11} className="animate-spin" /> : <LogOut size={11} />}
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
