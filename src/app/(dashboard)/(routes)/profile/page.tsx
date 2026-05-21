"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, User, Mail, ShieldCheck } from "lucide-react";

interface Session {
  role: string | null; is_demo: boolean;
  email: string | null; display_name: string; user_id: string | null;
}

export default function TeamProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(setSession)
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 size={20} className="animate-spin text-gray-400" />
    </div>
  );

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-gray-950 mb-6">Profile</h1>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {/* Avatar header */}
        <div className="bg-gray-950 px-6 py-8 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold text-white">
            {session?.display_name?.charAt(0) ?? "Q"}
          </div>
          <div>
            <p className="text-white font-semibold text-lg">{session?.display_name ?? "Quanta Team"}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span className="text-white/60 text-xs capitalize">{session?.role ?? "quanta"}</span>
              {session?.is_demo && <span className="text-xs bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full">Demo</span>}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Mail size={14} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-medium text-gray-900">{session?.email ?? "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <User size={14} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Role</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{session?.role ?? "—"}</p>
            </div>
          </div>

          {session?.is_demo && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs text-amber-800 font-medium">Demo mode active</p>
              <p className="text-xs text-amber-700 mt-0.5">
                You&apos;re exploring without a real account. Sign in with credentials for a full session.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 pb-5">
          <button onClick={logout} disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 transition-all">
            {loggingOut ? <Loader2 size={14} className="animate-spin" /> : <><LogOut size={14} /> Sign out</>}
          </button>
        </div>
      </div>
    </div>
  );
}
