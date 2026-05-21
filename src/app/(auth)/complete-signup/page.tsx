"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Zap, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function CompleteSignupPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"setup" | "otp" | "done">("setup");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    // TODO Phase 2: POST /api/auth/complete-signup { token, password, phone }
    setStep("otp");
  }

  function handleOtp(e: React.FormEvent) {
    e.preventDefault();
    // TODO Phase 2: POST /api/auth/verify-phone { otp }
    setStep("done");
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">Quanta Scout OS</span>
        </div>

        {step === "setup" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Create your account</h1>
            <p className="text-sm text-gray-500 mb-5">You've been invited to join Quanta's scout network.</p>

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
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                  >
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
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-indigo-400"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">We'll send a one-time code to verify.</p>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <button
                type="submit"
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                Continue <ArrowRight size={14} />
              </button>
            </form>
          </div>
        )}

        {step === "otp" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h1 className="text-lg font-semibold text-gray-900 mb-1">Verify your phone</h1>
            <p className="text-sm text-gray-500 mb-5">
              We sent a 6-digit code to <span className="font-medium text-gray-800">{form.phone}</span>.
            </p>
            <form onSubmit={handleOtp} className="space-y-4">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="w-full h-12 border border-gray-200 rounded-lg px-3 text-center text-xl tracking-widest font-semibold focus:outline-none focus:border-indigo-400"
                required
              />
              <button
                type="submit"
                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Verify
              </button>
            </form>
          </div>
        )}

        {step === "done" && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">You're in</h1>
            <p className="text-sm text-gray-500 mb-5">
              Your Quanta Scout account is ready.
            </p>
            <a
              href="/scout"
              className="inline-flex items-center justify-center gap-2 w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Go to Scout Portal <ArrowRight size={14} />
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
