"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account.");
      }

      // Store registered user session in local storage
      localStorage.setItem("insidealpha_user", JSON.stringify(data.user));
      
      setSuccess(true);
      setTimeout(() => {
        router.push("/terminal");
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] flex flex-col items-center justify-center px-4 relative overflow-hidden font-sans text-[#14172b]">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-sky-400/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Back button */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-6 left-6 flex items-center space-x-2 text-xs font-semibold text-[#565b74] hover:text-[#14172b] cursor-pointer transition-colors bg-white border border-[#e3e5ed] px-3.5 py-2 rounded-xl shadow-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Storefront</span>
      </button>

      <div className="max-w-md w-full z-10 space-y-6">
        {/* Logo Header */}
        <div className="flex flex-col items-center space-y-3.5 text-center">
          <div className="p-2.5 bg-gradient-to-br from-[#2563eb] to-[#38bdf8] rounded-xl shadow-sm">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-black text-[#14172b] tracking-tight font-display">Create Account</h1>
          <p className="text-[#565b74] text-xs max-w-[32ch] leading-relaxed">
            Register in the persistent SQLite database to save customized portfolios and run quantitative strategy audits.
          </p>
        </div>

        {/* Card Form */}
        <div className="bg-white border border-[#e3e5ed] rounded-2xl p-6 md:p-8 space-y-5 shadow-md relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#f7f8fa] border border-[#d3d7e2] rounded-full text-[9px] font-mono font-bold text-[#676c85] uppercase tracking-wider">
            Registration Node
          </div>

          {success ? (
            <div className="text-center py-8 space-y-3.5 animate-pulse">
              <div className="inline-flex p-3 bg-emerald-50 border border-emerald-250 rounded-full text-[#16a34a]">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#14172b]">Account Created Successfully!</p>
                <p className="text-[10px] text-[#676c85] mt-1 font-mono">Provisioning research sandbox keys...</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-[#f0505a] text-[10.5px] font-semibold rounded-xl text-center leading-relaxed">
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-[#676c85] uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Miller"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f7f8fa] border border-[#e3e5ed] rounded-xl text-xs font-semibold text-[#14172b] placeholder-[#676c85] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                />
              </div>

              {/* Email Address */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-[#676c85] uppercase tracking-wide">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="alex.miller@portfolio.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(null);
                  }}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f7f8fa] border border-[#e3e5ed] rounded-xl text-xs font-semibold text-[#14172b] placeholder-[#676c85] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-[#676c85] uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f7f8fa] border border-[#e3e5ed] rounded-xl text-xs font-semibold text-[#14172b] placeholder-[#676c85] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#2563eb] hover:bg-[#3b82f6] text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-sm active:scale-97 cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-60 disabled:cursor-not-allowed shadow-[#2563eb]/20 border border-white/5"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Register Account</span>
                  )}
                </button>
              </div>
              {/* Back to Sign In Option */}
              <div className="text-center pt-3 border-t border-[#e3e5ed] mt-4 text-[10.5px] text-[#565b74]">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("insidealpha_trigger_signin", "true");
                    router.push("/terminal");
                  }}
                  className="font-bold text-[#2563eb] hover:text-[#3b82f6] transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
