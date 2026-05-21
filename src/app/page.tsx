"use client";

import { useState } from "react";
import { ArrowRight, Briefcase, MessageCircle, Zap, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";

type Role = "team" | "scout";

const ROLES = {
  team: {
    label: "Quanta Team",
    sublabel: "Internal dashboard",
    desc: "Review signals, triage deals, ask scouts follow-up questions.",
    icon: Briefcase,
    redirect: "/inbox",
  },
  scout: {
    label: "Scout",
    sublabel: "Scout portal",
    desc: "Submit leads, track your startups, reply to Quanta.",
    icon: MessageCircle,
    redirect: "/scout",
  },
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("team");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const active = ROLES[role];
  const Icon = active.icon;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { setError("Enter your email and password."); return; }
    setError(""); setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error ?? "Incorrect email or password."); return; }

      // Store scout_id for the scout portal if needed
      if (data.scout_id && typeof window !== "undefined") {
        localStorage.setItem("quanta_scout_id", data.scout_id);
      }

      router.push(data.redirect ?? active.redirect);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin() {
    setLoading(true);
    // Set demo cookie via API then redirect
    await fetch(`/api/auth/demo?role=${role}`, { method: "POST" });
    router.push(active.redirect);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <div className="max-w-5xl mx-auto w-full px-5 py-6 flex flex-col min-h-screen">
        {/* Logo */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-950 flex items-center justify-center">
              <Zap size={15} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-950">Quanta Scout OS</span>
          </div>
        </header>

        <section className="flex-1 grid items-center gap-10 py-10 lg:grid-cols-[1fr_360px]">
          {/* Left: role cards */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              AI-native venture scout intelligence
            </p>
            <h1 className="text-4xl font-bold text-gray-950 leading-tight mb-4">
              Two workspaces.<br />One platform.
            </h1>
            <p className="text-gray-500 text-base leading-7 mb-8 max-w-md">
              Scouts submit leads through a lightweight portal. Quanta gets an AI-powered deal inbox with signals, briefs, and follow-ups.
            </p>

            <div className="grid grid-cols-2 gap-3 max-w-md">
              {(["team", "scout"] as Role[]).map((r) => {
                const cfg = ROLES[r];
                const RIcon = cfg.icon;
                const selected = role === r;
                return (
                  <button key={r} onClick={() => { setRole(r); setEmail(""); setError(""); }}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      selected ? "border-gray-950 bg-gray-950 text-white" : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <RIcon size={18} className={`mb-3 ${selected ? "text-white" : "text-gray-400"}`} />
                    <p className={`text-sm font-semibold ${selected ? "text-white" : "text-gray-900"}`}>{cfg.label}</p>
                    <p className={`text-xs mt-0.5 ${selected ? "text-white/60" : "text-gray-400"}`}>{cfg.sublabel}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: login form */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Icon size={18} className="text-gray-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">{active.sublabel}</p>
                <p className="text-base font-semibold text-gray-950">{active.label}</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === "team" ? "team@quanta.vc" : "your@email.com"}
                  className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 border border-gray-200 rounded-lg px-3 pr-9 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-600 flex items-center gap-1.5">
                  <AlertCircle size={12} />{error}
                </p>
              )}

              <button type="submit" disabled={loading}
                className="w-full h-10 rounded-lg bg-gray-950 hover:bg-gray-800 text-white text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><ArrowRight size={14} /> Sign in</>
                }
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button onClick={handleDemoLogin} disabled={loading}
                className="w-full h-9 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                Explore demo without an account →
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
