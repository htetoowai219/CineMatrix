import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Film,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useUserStore } from "../stores/user.store";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginAction, isLoading, error, clearError } = useUserStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginAction({ email, password });
      navigate("/");
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex selection:bg-red-600 selection:text-white relative">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate("/login")}
        className="absolute top-5 left-5 flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Left: Branding panel */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-900">
        <img
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&h=1200&fit=crop&auto=format"
          alt="Cinema experience"
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/30">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-black text-xl text-white uppercase tracking-wider">
              CineMatrix
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-0.5 bg-red-500" />
              <span className="text-red-500 text-xs font-bold uppercase tracking-widest">
                Admin Portal
              </span>
            </div>
            <h1 className="font-display font-black text-4xl xl:text-5xl text-white uppercase leading-tight tracking-tight">
              Manage your
              <br />
              cinematic
              <br />
              empire
            </h1>
            <p className="text-slate-400 text-sm mt-4 max-w-md leading-relaxed">
              Centralize movie listings, onboard cinemas, and keep the global
              catalog running from a single dashboard.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Login form */}
      <div className="flex-1 flex items-center justify-center px-6 sm:px-12 py-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shadow-md shadow-red-600/25">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-black text-lg text-white uppercase tracking-wider">
              CineMatrix Admin
            </span>
          </div>

          <div className="mb-7">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-red-500" />
              <span className="text-red-500 text-xs font-bold uppercase tracking-widest">
                Restricted Access
              </span>
            </div>
            <h2 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wide">
              Sign In
            </h2>
            <p className="text-slate-400 text-xs mt-1.5">
              Enter your super admin credentials to continue.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-600/50 rounded-lg flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  placeholder="admin@cinematrix.com"
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
                  aria-label={showPass ? "Hide password" : "Show password"}
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
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Sign In to Dashboard</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
