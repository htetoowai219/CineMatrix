import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Film,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Check,
  Globe,
  ArrowLeft,
  User,
  Book,
} from "lucide-react";
import SectionLabel from "../components/SectionLabel";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    navigate("/profile");
  };

  return (
    <div className="h-screen w-screen overflow-hidden grid grid-cols-1 md:grid-cols-2 bg-slate-950 text-white selection:bg-red-600 selection:text-white relative">
      {/* Top-Left Back to Home Link */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 z-30 flex items-center gap-2 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors drop-shadow-md"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      {/* Left: Cinematic Branding Side (Matching Login Page Background Image) */}
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
            Join the
            <br />
            Ultimate Cinema
            <br />
            Experience
          </h2>

          <p className="text-slate-400 text-xs sm:text-sm max-w-sm leading-relaxed">
            Create your free account and get exclusive access to early ticket
            sales, member discounts, and personalized recommendations.
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
      <div className="h-full flex items-center justify-center px-6 sm:px-12 py-4 bg-slate-950 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {/* Mobile Logo Header */}
          <div className="md:hidden flex items-center gap-2 mb-4 mt-8">
            <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center shadow-md shadow-red-600/20">
              <Film className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-white uppercase tracking-wider">
              CineMatrix
            </span>
          </div>

          {/* Header */}
          <div className="mb-4">
            <SectionLabel>Get Started</SectionLabel>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-wide">
              Create Account
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              {"Already a member? "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-red-500 font-semibold hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="flex gap-2.5 mb-3">
            {[
              { label: "Google", icon: <Globe className="w-3.5 h-3.5" /> },
              { label: "Facebook", icon: <Book className="w-3.5 h-3.5" /> },
            ].map(({ label, icon }) => (
              <button
                key={label}
                type="button"
                className="flex-1 flex items-center justify-center gap-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold py-2 rounded-xl transition-all active:scale-95"
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-slate-800/80" />
            <span className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
              or with email
            </span>
            <div className="flex-1 h-px bg-slate-800/80" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
            {/* First & Last Name Fields */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Alex"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Chen"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all"
                  required
                />
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-9 py-2 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms Checkbox */}
            <label className="flex items-start gap-2 cursor-pointer select-none pt-1">
              <button
                type="button"
                role="checkbox"
                aria-checked={agreed}
                onClick={() => setAgreed(!agreed)}
                className={`w-3.5 h-3.5 rounded border mt-0.5 transition-all flex items-center justify-center shrink-0 ${
                  agreed
                    ? "bg-red-600 border-red-600"
                    : "border-slate-700 bg-slate-900"
                }`}
              >
                {agreed && <Check className="w-2.5 h-2.5 text-white" />}
              </button>
              <span className="text-slate-400 text-xs leading-tight">
                I agree to the{" "}
                <button
                  type="button"
                  className="text-red-500 hover:underline font-semibold"
                >
                  Terms
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  className="text-red-500 hover:underline font-semibold"
                >
                  Privacy Policy
                </button>
              </span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!agreed}
              className="mt-1 w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600 active:scale-95 text-white font-semibold text-xs py-2.5 rounded-lg transition-all shadow-lg shadow-red-600/25"
            >
              Create Account
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
