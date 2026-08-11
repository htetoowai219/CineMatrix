import React, { useState } from "react";
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  Loader2,
  Camera,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useUserStore } from "../stores/user.store";
import Modal from "../components/ui/Modal";

export default function ProfilePage() {
  const {
    user,
    isLoading,
    error,
    updateProfileAction,
    updatePasswordAction,
    clearError,
  } = useUserStore();

  const [tab, setTab] = useState<"info" | "security">("info");

  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false);
  const [isEditPassOpen, setIsEditPassOpen] = useState(false);

  const [tempInfo, setTempInfo] = useState({ name: "", phone: "" });
  const [passData, setPassData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const handleOpenEditInfo = () => {
    clearError();
    setTempInfo({ name: user?.name || "", phone: user?.phone || "" });
    setIsEditInfoOpen(true);
  };

  const handleOpenEditPass = () => {
    clearError();
    setPassData({ currentPassword: "", newPassword: "" });
    setIsEditPassOpen(true);
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileAction(tempInfo);
      setIsEditInfoOpen(false);
    } catch {
      // Error state handled inside the store
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePasswordAction(passData);
      setPassData({ currentPassword: "", newPassword: "" });
      setIsEditPassOpen(false);
    } catch {
      // Error state handled inside the store
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await updateProfileAction({ profileImage: file });
    } catch {
      // Error state handled inside the store
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1">
          Account
        </p>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wide">
          Admin Profile
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your personal details and account security.
        </p>
      </div>

      {/* Profile header card */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 mb-8 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-xl">
        <div className="relative w-20 h-20 shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-950 flex items-center justify-center border border-red-500/30 shadow-lg shadow-red-600/20 overflow-hidden">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-display font-black text-2xl text-white uppercase tracking-wider">
                {user?.name ? user.name[0] : "A"}
              </span>
            )}
          </div>
          <label
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 flex items-center justify-center cursor-pointer transition-colors shadow-md"
            title="Change profile picture"
          >
            <Camera className="w-3.5 h-3.5 text-slate-200" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isLoading}
              onChange={handleAvatarChange}
            />
          </label>
        </div>

        <div className="flex-1">
          <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-wide">
            {user?.name || "Loading..."}
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {user?.email || "—"}
          </p>
          <div className="flex flex-wrap gap-2.5 mt-3">
            <span className="text-xs bg-red-950/40 border border-red-600/40 text-red-500 px-3 py-1 rounded-full font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Super Admin
            </span>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 bg-slate-900/90 border border-slate-800/90 rounded-xl p-1 mb-8 w-full sm:w-fit overflow-x-auto scrollbar-none">
        {(["info", "security"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold capitalize transition-all whitespace-nowrap ${
              tab === t
                ? "bg-red-600 text-white shadow-md shadow-red-600/20 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t === "info" ? "Personal Info" : "Security"}
          </button>
        ))}
      </div>

      {/* Personal Info Tab */}
      {tab === "info" && (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 sm:p-8 max-w-2xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-white uppercase tracking-wide text-xl">
              Personal Information
            </h3>
            <button
              onClick={handleOpenEditInfo}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-700 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5 text-red-500" /> Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/60 p-5 rounded-xl border border-slate-800/80">
            <div className="col-span-1 md:col-span-2">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                Full Name
              </p>
              <p className="text-slate-200 text-sm font-semibold">
                {user?.name || "—"}
              </p>
            </div>

            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                Email Address
              </p>
              <p className="text-slate-200 text-sm font-semibold">
                {user?.email || "—"}
              </p>
            </div>

            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                Phone Number
              </p>
              <p className="text-slate-200 text-sm font-semibold">
                {user?.phone || "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {tab === "security" && (
        <div className="max-w-2xl">
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display font-bold text-white uppercase tracking-wide text-xl">
                  Account Security
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Manage your password and security credentials
                </p>
              </div>
              <button
                onClick={handleOpenEditPass}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white text-xs font-semibold px-3.5 py-2 rounded-lg border border-slate-700 transition-all shrink-0"
              >
                <Lock className="w-3.5 h-3.5 text-red-500" /> Change Password
              </button>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                  Password Status
                </p>
                <p className="text-slate-200 text-sm font-semibold">
                  ••••••••••••
                </p>
              </div>
              <span className="text-[11px] text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded">
                Active
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Edit Personal Info Modal */}
      {isEditInfoOpen && (
        <Modal
          title="Update Personal Info"
          onClose={() => !isLoading && setIsEditInfoOpen(false)}
          maxWidth="max-w-lg"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-600/50 rounded-lg text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSaveInfo} className="space-y-4">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={tempInfo.name}
                  onChange={(e) =>
                    setTempInfo({ ...tempInfo, name: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-600/60"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={tempInfo.phone}
                  onChange={(e) =>
                    setTempInfo({ ...tempInfo, phone: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-white text-sm focus:outline-none focus:border-red-600/60"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditInfoOpen(false)}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Password Modal */}
      {isEditPassOpen && (
        <Modal
          title="Change Password"
          onClose={() => !isLoading && setIsEditPassOpen(false)}
          maxWidth="max-w-md"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-600/50 rounded-lg text-red-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showOldPass ? "text" : "password"}
                  value={passData.currentPassword}
                  onChange={(e) =>
                    setPassData({
                      ...passData,
                      currentPassword: e.target.value,
                    })
                  }
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-red-600/60"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPass(!showOldPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showOldPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showNewPass ? "text" : "password"}
                  value={passData.newPassword}
                  onChange={(e) =>
                    setPassData({ ...passData, newPassword: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-10 py-2.5 text-white text-sm focus:outline-none focus:border-red-600/60"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showNewPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditPassOpen(false)}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Update Password
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
