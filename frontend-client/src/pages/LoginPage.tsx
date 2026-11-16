import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import SectionLabel from "../components/SectionLabel";
import { useUserStore } from "../stores/user.store";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { loginAction, isLoading, error, clearError } = useUserStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginAction({ email, password });
      const from =
        (location.state as { from?: string } | null)?.from || "/profile";
      navigate(from);
    } catch {

    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden grid grid-cols-1 md:grid-cols-2 bg-slate-950 text-white selection:bg-red-600 selection:text-white relative">
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

      <div className="hidden md:block relative h-full overflow-hidden bg-slate-900">
        <img
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&h=1200&fit=crop&auto=format"
          alt="Cinema experience"
          className="w-full h-full object-cover opacity-40 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-950/40 to-slate-950" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40" />

        <div className="absolute inset-0 flex flex-col items-start justify-end p-10 lg:p-14 z-10">
          <div className="flex items-center gap-2.5 mb-4">
            <img
              src="/logo.png"
              alt=""
              className="h-10 w-10 shrink-0 object-contain drop-shadow-lg"
            />
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
            Book tickets, choose your seats, and manage your cinema visits in one
            place.
          </p>
        </div>
      </div>

      <div className="h-full flex items-center justify-center px-6 sm:px-12 py-6 bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          <div className="md:hidden flex items-center gap-2 mb-6 mt-10">
            <img
              src="/logo.png"
              alt=""
              className="h-9 w-9 shrink-0 object-contain"
            />
            <span className="font-display font-bold text-lg text-white uppercase tracking-wider">
              CineMatrix
            </span>
          </div>

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

          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-600/50 rounded-lg flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
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
