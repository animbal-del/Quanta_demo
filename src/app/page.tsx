"use client";

import { useState } from "react";
import { ArrowRight, Briefcase, MessageCircle, ShieldCheck, Zap } from "lucide-react";
import { useRouter } from "next/navigation";

type LoginMode = "team" | "scout";

const loginCopy = {
  team: {
    eyebrow: "Quanta Team",
    title: "Internal deal intelligence",
    description: "Review scout signals, ask follow-ups, run the scheduler, and manage the deal inbox.",
    email: "team@quanta.vc",
    action: "Enter Team Dashboard",
    route: "/inbox",
    icon: Briefcase,
  },
  scout: {
    eyebrow: "Scout",
    title: "Text Quanta a lead",
    description: "Submit founders through a lightweight chat flow and track only what needs your attention.",
    email: "amit@scout.quanta.vc",
    action: "Enter Scout Portal",
    route: "/scout",
    icon: MessageCircle,
  },
};

export default function RootPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("team");
  const [email, setEmail] = useState(loginCopy.team.email);
  const [password, setPassword] = useState("demo");

  const active = loginCopy[mode];
  const ActiveIcon = active.icon;

  function chooseMode(nextMode: LoginMode) {
    setMode(nextMode);
    setEmail(loginCopy[nextMode].email);
  }

  function login(e: React.FormEvent) {
    e.preventDefault();
    window.localStorage.setItem("quanta_demo_role", mode);
    window.localStorage.setItem("quanta_demo_email", email);
    router.push(active.route);
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
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
            Demo login
          </div>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[1fr_420px]">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-indigo-600">
              OpenClaw-powered venture scout intelligence
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold leading-tight text-gray-950">
              Two focused workspaces: one for Quanta, one for scouts.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-gray-600">
              Quanta gets the operating dashboard for deal triage and follow-up. Scouts get a chat-first portal that feels like texting a lead, not filling out a CRM.
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
                    className={`rounded-lg border bg-white p-4 text-left transition-all ${
                      selected ? "border-indigo-300 ring-2 ring-indigo-100" : "border-gray-200 hover:border-gray-300"
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
                    <p className="mt-1.5 text-xs leading-5 text-gray-500">{details.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={login} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <ActiveIcon size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-indigo-600">{active.eyebrow} Login</p>
                <h2 className="text-lg font-semibold text-gray-950">{active.title}</h2>
              </div>
            </div>

            <label className="mb-1.5 block text-xs font-medium text-gray-600" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none transition-colors focus:border-indigo-400"
            />

            <label className="mb-1.5 block text-xs font-medium text-gray-600" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-5 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none transition-colors focus:border-indigo-400"
            />

            <button
              type="submit"
              className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              {active.action}
              <ArrowRight size={15} />
            </button>

            <p className="mt-3 text-center text-xs text-gray-400">
              Demo credentials are prefilled. Pick a role to switch flows.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
