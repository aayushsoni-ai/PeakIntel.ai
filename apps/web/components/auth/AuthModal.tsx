"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/authStore";
import { X, Lock, Mail, User, Building, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "signin" | "signup";
}

export function AuthModal({ isOpen, onClose, defaultTab = "signin" }: AuthModalProps) {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab);
  const [email, setEmail] = useState("saurabh@peakintel.ai");
  const [password, setPassword] = useState("••••••••••••");
  const [fullName, setFullName] = useState("Saurabh Soni");
  const [firmName, setFirmName] = useState("PeakIntel Equity Group");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login({
        name: fullName || "Saurabh Soni",
        email: email || "saurabh@peakintel.ai",
        role: "Senior Investment Partner",
      });
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        router.push("/");
      }, 500);
    }, 600);
  };

  const handleDemoAccess = () => {
    setLoading(true);
    setTimeout(() => {
      login({
        name: "Saurabh Soni",
        email: "saurabh@peakintel.ai",
        role: "Senior Investment Partner",
      });
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onClose();
        router.push("/");
      }, 400);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative p-6 pb-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 font-bold text-slate-950 text-base">
              PI
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                PeakIntel AI <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-normal">v2.4</span>
              </h2>
              <p className="text-xs text-slate-400">Autonomous Financial Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-6 pt-4 flex gap-2 border-b border-slate-800/80">
          <button
            type="button"
            onClick={() => setActiveTab("signin")}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors relative ${
              activeTab === "signin" ? "text-amber-400" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sign In
            {activeTab === "signin" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("signup")}
            className={`pb-3 text-xs font-semibold uppercase tracking-wider transition-colors relative ml-4 ${
              activeTab === "signup" ? "text-amber-400" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Register Firm
            {activeTab === "signup" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {success ? (
            <div className="py-8 text-center space-y-3 animate-fade-in">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h3 className="text-lg font-semibold text-slate-100">Welcome to PeakIntel</h3>
              <p className="text-xs text-slate-400">Authenticating session and loading portfolio...</p>
            </div>
          ) : (
            <>
              {/* Quick 1-Click Demo Login */}
              <button
                type="button"
                onClick={handleDemoAccess}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-500/20 hover:from-amber-500/30 hover:to-amber-400/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md group"
              >
                <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span>Instant 1-Click Partner Demo Access</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="h-[1px] flex-1 bg-slate-800" />
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Or Credentials</span>
                <div className="h-[1px] flex-1 bg-slate-800" />
              </div>

              <form onSubmit={handleSignIn} className="space-y-3">
                {activeTab === "signup" && (
                  <>
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">Full Name</label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Saurabh Soni"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/70"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-300 block mb-1">Fund / Organization</label>
                      <div className="relative">
                        <Building className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={firmName}
                          onChange={(e) => setFirmName(e.target.value)}
                          placeholder="PeakIntel Equity Group"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/70"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Work Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="saurabh@peakintel.ai"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/70"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500/70"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{activeTab === "signin" ? "Sign In to Platform" : "Create Partner Account"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Enterprise 256-bit AES encrypted private session</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
