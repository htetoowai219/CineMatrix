import React, { useState, useEffect } from "react";
import {
  User,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  X,
  Loader2,
  Camera,
  Ticket,
} from "lucide-react";
import SectionLabel from "../components/SectionLabel";
import { useUserStore } from "../stores/user.store";
import { useBookingStore } from "../stores/booking.store";
import { type IBooking, type BookingStatus } from "../types/booking.type";
import { formatCurrency } from "../utils/currency";

const STATUS_STYLES: Record<BookingStatus, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-950/40 border border-amber-600/40 text-amber-400",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-emerald-950/40 border border-emerald-600/40 text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-950/40 border border-red-600/40 text-red-400",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-slate-800/60 border border-slate-700 text-slate-400",
  },
};

// Flattens a backend booking (with populated screeningId) into display fields.
const flattenBooking = (booking: IBooking) => {
  const screening =
    booking.screeningId && typeof booking.screeningId === "object"
      ? booking.screeningId
      : null;
  const movie =
    screening && typeof screening.movieId === "object" ? screening.movieId : null;
  const cinema =
    screening && typeof screening.cinemaId === "object" ? screening.cinemaId : null;
  const startTime = screening ? new Date(screening.startTime) : null;

  return {
    id: booking._id,
    movieTitle: movie?.title ?? "Screening",
    poster: movie?.posterUrl ?? "",
    cinema: cinema?.name ?? "",
    date: startTime ? startTime.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—",
    time: startTime ? startTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "—",
    room: screening?.roomName ?? "",
    seats: booking.seats.map((s) => s.label),
    total: booking.totalPrice,
    currency: cinema?.currency,
    status: booking.status,
  };
};

export default function ProfilePage() {
  const {
    user,
    isLoading,
    error,
    getProfileAction,
    updateProfileAction,
    updatePasswordAction,
    clearError,
  } = useUserStore();

  const {
    myBookings,
    isLoading: isBookingsLoading,
    isBooking,
    error: bookingsError,
    getMyBookingsAction,
    cancelBookingAction,
  } = useBookingStore();

  const [tab, setTab] = useState<"info" | "security" | "bookings">("bookings");

  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false);
  const [isEditPassOpen, setIsEditPassOpen] = useState(false);

  const [tempInfo, setTempInfo] = useState({ name: "", phone: "" });
  const [passData, setPassData] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  useEffect(() => {
    getProfileAction();
  }, [getProfileAction]);

  useEffect(() => {
    if (tab === "bookings") {
      getMyBookingsAction();
    }
  }, [tab, getMyBookingsAction]);

  const handleOpenEditInfo = () => {
    clearError();
    setTempInfo({
      name: user?.name || "",
      phone: user?.phone || "",
    });
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
      // Error state handled inside Zustand store
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updatePasswordAction(passData);
      setPassData({ currentPassword: "", newPassword: "" });
      setIsEditPassOpen(false);
    } catch {
      // Error state handled inside Zustand store
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await updateProfileAction({ profileImage: file });
    } catch {
      // Error state handled inside Zustand store
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen text-white pt-24 pb-20 selection:bg-red-600 selection:text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <SectionLabel>Account Overview</SectionLabel>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white uppercase tracking-wide">
            User Profile
          </h1>
        </div>

        {/* Profile Header Card */}
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
                  {user?.name ? user.name[0] : "U"}
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
              <span className="text-xs bg-red-950/40 border border-red-600/40 text-red-500 px-3 py-1 rounded-full font-bold">
                Premium Member
              </span>
            </div>
          </div>

          <div className="flex gap-6 sm:gap-8 text-center border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-8 w-full md:w-auto justify-around md:justify-start">
            {[
              [String(myBookings.length), "Bookings"],
              ["2", "Watchlist"],
              ["14", "Reviews"],
            ].map(([n, l]) => (
              <div key={l}>
                <div className="font-display font-black text-2xl text-white">
                  {n}
                </div>
                <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-slate-900/90 border border-slate-800/90 rounded-xl p-1 mb-8 w-full sm:w-fit overflow-x-auto scrollbar-none">
          {(["bookings", "info", "security"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold capitalize transition-all whitespace-nowrap ${
                tab === t
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t === "bookings"
                ? "My Bookings"
                : t === "info"
                  ? "Personal Info"
                  : "Security"}
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

        {/* Bookings Tab */}
        {tab === "bookings" && (
          <div className="flex flex-col gap-6">
            {(bookingsError || error) && (
              <div className="p-3 bg-red-950/50 border border-red-600/50 rounded-lg text-red-400 text-xs font-semibold">
                {bookingsError || error}
              </div>
            )}

            {isBookingsLoading ? (
              <div className="flex items-center justify-center py-20 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-red-600 mr-3" />
                <span className="text-sm">Loading your bookings...</span>
              </div>
            ) : myBookings.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
                <Ticket className="w-10 h-10 mx-auto mb-3 text-slate-600 opacity-60" />
                <p className="text-slate-400 text-sm">
                  No bookings yet. Browse movies and book your first screening.
                </p>
              </div>
            ) : (
              myBookings.map((raw) => {
                const booking = flattenBooking(raw);
                const statusStyle = STATUS_STYLES[booking.status];
                return (
                  <div
                    key={booking.id}
                    className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl"
                  >
                    <div className="p-5 sm:p-6 flex flex-col lg:flex-row gap-6">
                      {booking.poster && (
                        <img
                          src={booking.poster}
                          alt={booking.movieTitle}
                          className="w-24 h-36 object-cover rounded-xl bg-slate-950 border border-slate-800 shrink-0 mx-auto sm:mx-0"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
                          <h3 className="font-display font-bold text-white text-xl sm:text-2xl uppercase tracking-wide">
                            {booking.movieTitle}
                          </h3>
                          <span
                            className={`text-xs px-3 py-1 rounded-full font-bold shrink-0 ${statusStyle.className}`}
                          >
                            {statusStyle.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
                          {[
                            { label: "Cinema", value: booking.cinema || "—" },
                            { label: "Date", value: booking.date },
                            { label: "Time", value: booking.time },
                            { label: "Room", value: booking.room || "—" },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                                {label}
                              </p>
                              <p className="text-slate-200 text-xs sm:text-sm font-semibold truncate">
                                {value}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-6 flex-wrap">
                          <div>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                              Seats
                            </p>
                            <div className="flex gap-1.5 flex-wrap">
                              {booking.seats.map((s) => (
                                <span
                                  key={s}
                                  className="text-xs font-bold text-red-500 bg-red-950/30 border border-red-600/40 px-2.5 py-0.5 rounded"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                              Total
                            </p>
                            <p className="text-white font-bold text-sm sm:text-base">
                              {formatCurrency(booking.total, booking.currency)}
                            </p>
                          </div>

                          <div>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                              Booking Ref
                            </p>
                            <p className="text-slate-300 text-xs sm:text-sm font-mono font-semibold">
                              {booking.id}
                            </p>
                          </div>
                        </div>

                        {booking.status === "pending" && (
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              disabled={isBooking}
                              onClick={() => cancelBookingAction(booking.id)}
                              className="flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-950/50 border border-red-600/40 px-3.5 py-2 rounded-lg transition-all disabled:opacity-50"
                            >
                              {isBooking && (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              )}
                              Cancel Booking
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Edit Personal Info Modal */}
      {isEditInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setIsEditInfoOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-bold text-white uppercase tracking-wide text-xl mb-6">
              Update Personal Info
            </h3>

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
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
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
                  {isLoading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Password Modal */}
      {isEditPassOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsEditPassOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-display font-bold text-white uppercase tracking-wide text-xl mb-6">
              Change Password
            </h3>

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
                  {isLoading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
