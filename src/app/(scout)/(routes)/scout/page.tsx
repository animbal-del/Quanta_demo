"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Clock,
  FileQuestion,
  MessageCircle,
  Plus,
  Zap,
} from "lucide-react";

const startups = [
  {
    id: "flowops",
    name: "FlowOps",
    description: "AI logistics agents",
    status: "Waiting on deck",
    action: "Open",
    tone: "amber",
    icon: Clock,
  },
  {
    id: "campuspay",
    name: "CampusPay",
    description: "Payments for campus clubs",
    status: "Quanta asked a question",
    action: "Reply",
    tone: "indigo",
    icon: MessageCircle,
  },
  {
    id: "medsync",
    name: "MedSync AI",
    description: "Patient scheduling AI",
    status: "Under review",
    action: "Open",
    tone: "green",
    icon: FileQuestion,
  },
];

const toneClasses: Record<string, string> = {
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

export default function ScoutHomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col bg-white">
      <header className="border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Scout Portal</p>
            <h1 className="text-lg font-semibold text-gray-950">Hi Amit</h1>
          </div>
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
            <Zap size={15} />
          </Link>
        </div>
      </header>

      <section className="border-b border-gray-100 px-4 py-5">
        <h2 className="text-xl font-semibold leading-tight text-gray-950">
          Seen an interesting startup recently?
        </h2>
        <Link
          href="/add-startup"
          className="mt-4 flex h-11 items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-medium text-white"
        >
          <Plus size={16} />
          Add Startup
        </Link>
      </section>

      <section className="flex-1 px-4 py-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Your Startups</h2>
          <Link href="/submissions" className="text-xs font-medium text-indigo-600">
            View all
          </Link>
        </div>

        <div className="space-y-3">
          {startups.map((startup) => {
            const Icon = startup.icon;
            return (
              <Link
                key={startup.id}
                href={`/startups/${startup.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-950">{startup.name}</h3>
                    <p className="mt-0.5 text-xs text-gray-500">{startup.description}</p>
                    <span
                      className={`mt-3 inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${toneClasses[startup.tone]}`}
                    >
                      <Icon size={11} />
                      {startup.status}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-medium text-indigo-600">
                    {startup.action}
                    <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t border-gray-100 px-4 py-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 size={15} className="text-indigo-600" />
            <h2 className="text-sm font-semibold text-gray-900">Your Activity</h2>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-semibold text-gray-950">12</p>
              <p className="text-xs text-gray-400">Submitted</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-emerald-600">4</p>
              <p className="text-xs text-gray-400">Moved forward</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-amber-600">5</p>
              <p className="text-xs text-gray-400">Pending</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
