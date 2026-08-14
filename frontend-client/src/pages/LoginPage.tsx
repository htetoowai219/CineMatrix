import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Film,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  Globe,
  ArrowLeft,
  Book,
  Loader2,
  AlertCircle,
} from "lucide-react";
import SectionLabel from "../components/SectionLabel";
import { useUserStore } from "../stores/user.store";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Zustand Store Hooks
  const { loginAction, isLoading, error, clearError } = useUserStore();

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginAction({ email, password });
      const from =
        (location.state as { from?: string } | null)?.from || "/profile";
      navigate(from);
    } catch {
      // Error is caught and stored in Zustand store state
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden grid grid-cols-1 md:grid-cols-2 bg-slate-950 text-white selection:bg-red-600 selection:text-white relative">
      {/* Top-Left Back to Home Link */}
      <button
        type="button"
        onClick={() => {
          clearError();
          navigate("/");
        }}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 flex items-center gap-2 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors drop-shadow-md"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      {/* Left: Cinematic Branding Side */}
      <div className="hidden md:block relative h-full overflow-hidden bg-slate-900">
        <img
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&h=1200&fit=crop&auto=format"
          alt="Cinema experience"
          className="w-full h-full object-cover opacity-40 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-950/40 to-slate-950" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />

        <div className="absolute inset-0 flex flex-col items-start justify-end p-10 lg:p-14 z-10">
          {/* Logo Branding */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/30">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-black text-xl text-white uppercase tracking-wider">
              CineMatrix
            </span>
          </div>

          <h2 className="font-display font-black text-3xl lg:text-4xl text-white uppercase leading-tight mb-3 tracking-tight">
            The Ultimate
            <br />
            Cinema
            <br />
            Experience
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm max-w-sm leading-relaxed">
            Book tickets, choose your seats, and enjoy premium cinema
            experiences at top venues across the city.
          </p>

          {/* Social Proof Stats */}
          <div className="flex items-center gap-8 mt-6 pt-6 border-t border-slate-800/80 w-full max-w-md">
            {[
              ["500K+", "Happy Guests"],
              ["120+", "Cinemas"],
              ["4.9", "App Rating"],
            ].map(([val, lbl]) => (
              <div key={lbl}>
                <div className="font-display font-black text-xl lg:text-2xl text-white">
                  {val}
                </div>
                <div className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mt-0.5">
                  {lbl}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Authentication Form Side */}
      <div className="h-full flex items-center justify-center px-6 sm:px-12 py-6 bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {/* Mobile Logo Header */}
          <div className="md:hidden flex items-center gap-2 mb-6 mt-10">
            <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center shadow-md shadow-red-600/20">
              <Film className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white uppercase tracking-wider">
              CineMatrix
            </span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <SectionLabel>Welcome Back</SectionLabel>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wide">
              Sign In
            </h1>
            <p className="text-slate-400 text-xs mt-1.5">
              {"Don't have an account? "}
              <button
                type="button"
                onClick={() => {
                  clearError();
                  navigate("/register");
                }}
                className="text-red-500 font-semibold hover:underline"
              >
                Register free
              </button>
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="flex gap-3 mb-4">
            {[
              { label: "Google", icon: <Globe className="w-4 h-4" /> },
              { label: "facebook", icon: <Book className="w-4 h-4" /> },
            ].map(({ label, icon }) => (
              <button
                key={label}
                type="button"
                className="flex-1 flex items-center justify-center gap-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all active:scale-95"
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-800/80" />
            <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
              or continue with email
            </span>
            <div className="flex-1 h-px bg-slate-800/80" />
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-600/50 rounded-lg flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {/* Email Field */}
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    if (error) clearError();
                    setEmail(e.target.value);
                  }}
                  placeholder="you@example.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all disabled:opacity-50"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    if (error) clearError();
                    setPassword(e.target.value);
                  }}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-12 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all disabled:opacity-50"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={remember}
                  onClick={() => setRemember(!remember)}
                  className={`w-4 h-4 rounded border transition-all flex items-center justify-center shrink-0 ${
                    remember
                      ? "bg-red-600 border-red-600"
                      : "border-slate-700 bg-slate-900"
                  }`}
                >
                  {remember && <Check className="w-3 h-3 text-white" />}
                </button>
                <span className="text-slate-400 text-xs font-medium">
                  Remember me
                </span>
              </label>

              <button
                type="button"
                className="text-red-500 hover:underline text-xs font-semibold"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-semibold text-sm py-2.5 rounded-lg transition-all shadow-lg shadow-red-600/25 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
