"use client";

import { useState } from "react";
import { ArrowRight, Briefcase, MessageCircle, ShieldCheck, Zap, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type LoginMode = "team" | "scout";

const loginCopy = {
  team: {
    eyebrow: "Quanta Team",
    title: "Internal deal intelligence",
    description: "Review scout signals, ask follow-ups, run the scheduler, and manage the deal inbox.",
    placeholder: "team@quanta.vc",
    action: "Enter Team Dashboard",
    route: "/inbox",
    icon: Briefcase,
  },
  scout: {
    eyebrow: "Scout",
    title: "Submit your leads",
    description: "Submit founders through a lightweight flow and track only what needs your attention.",
    placeholder: "you@email.com",
    action: "Enter Scout Portal",
    route: "/scout",
    icon: MessageCircle,
  },
};

export default function RootPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("team");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const active = loginCopy[mode];
  const ActiveIcon = active.icon;

  function chooseMode(nextMode: LoginMode) {
    setMode(nextMode);
    setEmail("");
    setError("");
  }

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Try real Supabase auth first
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        // Demo fallback — let team/scout demo credentials through
        const isTeamDemo = mode === "team" && (email === "team@quanta.vc" || email === "");
        const isScoutDemo = mode === "scout" && (email === "amit@scout.quanta.vc" || email === "");

        if (isTeamDemo || isScoutDemo) {
          router.push(active.route);
          return;
        }
        setError("Incorrect email or password.");
        return;
      }

      // Real login succeeded — get role and redirect
      if (data.user) {
        const res = await fetch("/api/auth/role");
        const { role } = await res.json();
        if (role === "scout") router.push("/scout");
        else router.push("/inbox");
        return;
      }

      // No user but no error — demo redirect
      router.push(active.route);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // Quick demo bypass — no credentials needed
  function demoLogin() {
    router.push(active.route);
  }

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Zap size={16} />
            </div>
            <span className="text-sm font-semibold">Quanta Scout OS</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-500">
            <ShieldCheck size={13} className="text-emerald-600" />
            Demo available
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1fr_380px]">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-600">
              AI-native venture scout intelligence
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-gray-950">
              Two workspaces. One for Quanta, one for scouts.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-gray-500">
              Quanta gets the operating dashboard for deal triage and follow-up. Scouts get a lightweight portal to submit leads and track what needs attention.
            </p>

            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-2">
              {(["team", "scout"] as const).map((item) => {
                const details = loginCopy[item];
                const Icon = details.icon;
                const selected = mode === item;
                return (
                  <button
                    key={item}
                    onClick={() => chooseMode(item)}
                    className={`rounded-xl border bg-white p-4 text-left transition-all ${
                      selected ? "border-indigo-300 ring-2 ring-indigo-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${selected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                        <Icon size={17} />
                      </div>
                      <span className={`text-xs font-medium ${selected ? "text-indigo-600" : "text-gray-400"}`}>
                        {details.eyebrow}
                      </span>
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">{details.title}</h2>
                    <p className="mt-1 text-xs leading-5 text-gray-500">{details.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <ActiveIcon size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-indigo-600">{active.eyebrow}</p>
                <h2 className="text-lg font-semibold text-gray-950">{active.title}</h2>
              </div>
            </div>

            <form onSubmit={login} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={active.placeholder}
                  className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-indigo-400"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 flex items-center gap-1.5">
                  <AlertCircle size={12} /> {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <>{active.action} <ArrowRight size={14} /></>
                }
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={demoLogin}
                className="w-full h-9 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Skip login — explore demo →
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
