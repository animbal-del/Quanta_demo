"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Zap, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";

interface TokenInfo {
  valid: boolean;
  email?: string;
  name?: string;
  error?: string;
}

export default function CompleteSignupPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [form, setForm] = useState({ password: "", confirmPassword: "", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"loading" | "setup" | "done" | "invalid">("loading");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setStep("invalid"); return; }

    fetch(`/api/auth/complete-signup?token=${token}`)
      .then((r) => r.json())
      .then((data: TokenInfo) => {
        setTokenInfo(data);
        setStep(data.valid ? "setup" : "invalid");
      })
      .catch(() => setStep("invalid"));
  }, [token]);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.password, phone: form.phone }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      setStep("done");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">Quanta Scout OS</span>
        </div>

        {step === "loading" && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-gray-500 mt-3">Validating your invite…</p>
          </div>
        )}

        {step === "invalid" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={20} className="text-red-500" />
            </div>
            <h1 className="text-base font-semibold text-gray-900 mb-1">Invalid invite link</h1>
            <p className="text-sm text-gray-500">{tokenInfo?.error ?? "This link is invalid or has expired. Ask Quanta to send a new invite."}</p>
          </div>
        )}

        {step === "setup" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Create your account</h1>
            <p className="text-sm text-gray-500 mb-5">
              Welcome{tokenInfo?.name ? `, ${tokenInfo.name}` : ""}. Setting up{" "}
              <span className="font-medium text-gray-800">{tokenInfo?.email}</span>.
            </p>
            <form onSubmit={handleSetup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="At least 8 characters"
                    className="w-full h-10 border border-gray-200 rounded-lg px-3 pr-9 text-sm focus:outline-none focus:border-indigo-400"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-indigo-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">
                  Phone Number <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
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
                disabled={submitting}
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <> Create Account <ArrowRight size={14} /></>
                )}
              </button>
            </form>
          </div>
        )}

        {step === "done" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">You&apos;re in</h1>
            <p className="text-sm text-gray-500 mb-5">Your Quanta Scout account is ready.</p>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center gap-2 w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Sign in to Scout Portal <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
