import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  Lock,
  Unlock,
  Armchair,
  Upload,
  Film,
  CheckCircle2,
  XCircle,
  Ticket,
} from "lucide-react";
import { format } from "date-fns";
import SectionLabel from "../components/SectionLabel";
import { useScreeningStore } from "../stores/screening.store";
import { useBookingStore } from "../stores/booking.store";
import { useUserStore } from "../stores/user.store";
import { type IScreeningSeat, type PaymentMethod } from "../types/booking.type";

const LOCK_SECONDS = 10 * 60;

// Groups seats by row so the room layout renders as rows of seats.
const groupByRow = (seats: IScreeningSeat[]) => {
  const rows: { row: string; seats: IScreeningSeat[] }[] = [];
  for (const seat of seats) {
    const group = rows.find((r) => r.row === seat.row);
    if (group) {
      group.seats.push(seat);
    } else {
      rows.push({ row: seat.row, seats: [seat] });
    }
  }
  return rows;
};

export default function BookingPage() {
  const { screeningId } = useParams<{ screeningId: string }>();
  const navigate = useNavigate();

  const {
    selectedScreening,
    isLoading: isScreeningLoading,
    error: screeningError,
    getPublicScreeningByIdAction,
    clearSelectedScreening,
  } = useScreeningStore();

  const {
    isLocking,
    isBooking,
    isUploading,
    error: bookingError,
    lockSeatsAction,
    unlockSeatsAction,
    uploadPaymentScreenshotAction,
    createBookingAction,
    clearError,
  } = useBookingStore();

  const { isAuthenticated } = useUserStore();

  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [lockedAt, setLockedAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(LOCK_SECONDS);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("in_person");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [submittedBooking, setSubmittedBooking] = useState<{
    id: string;
    seats: string[];
    total: number;
  } | null>(null);

  const releasedRef = useRef(false);
  const submittedRef = useRef(false);
  const selectedSeatsRef = useRef<string[]>([]);

  // Keeps the latest selection available to the unmount cleanup.
  useEffect(() => {
    selectedSeatsRef.current = selectedSeats;
  }, [selectedSeats]);

  useEffect(() => {
    if (screeningId) {
      clearError();
      getPublicScreeningByIdAction(screeningId);
    }
    return () => {
      clearSelectedScreening();
    };
  }, [screeningId, getPublicScreeningByIdAction, clearSelectedScreening, clearError]);

  // Redirect to login when the user tries to book while signed out.
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/book/${screeningId}` } });
    }
  }, [isAuthenticated, navigate, screeningId]);

  // Countdown tied to the lock's 10-minute expiry.
  useEffect(() => {
    if (!lockedAt) return;
    const tick = () => {
      const remaining = lockedAt + LOCK_SECONDS * 1000 - Date.now();
      setTimeLeft(Math.max(0, Math.floor(remaining / 1000)));
      if (remaining <= 0) {
        setLockedAt(null);
        setSelectedSeats([]);
        clearError();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockedAt, clearError]);

  // Release the hold when the customer leaves mid-booking.
  useEffect(() => {
    return () => {
      const screening = useScreeningStore.getState().selectedScreening;
      if (!screening?._id || releasedRef.current || submittedRef.current) return;
      releasedRef.current = true;
      const locked = selectedSeatsRef.current;
      if (locked.length > 0) {
        unlockSeatsAction(String(screening._id), locked);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const screening = selectedScreening;
  const movie = screening && typeof screening.movieId === "object" ? screening.movieId : null;
  const cinema = screening && typeof screening.cinemaId === "object" ? screening.cinemaId : null;

  const allowPayInPerson = Boolean(cinema?.allowPayInPerson);

  const rows = useMemo(
    () => (screening ? groupByRow(screening.seats) : []),
    [screening],
  );

  const canSelect =
    (seat: IScreeningSeat): boolean =>
      seat.status === "available" || seat.status === "held";

  const toggleSeat = (seat: IScreeningSeat) => {
    if (!canSelect(seat)) return;
    setSelectedSeats((prev) => {
      if (prev.includes(seat.label)) {
        return prev.filter((l) => l !== seat.label);
      }
      if (prev.length >= 8) return prev;
      return [...prev, seat.label];
    });
  };

  const selectedDetails = useMemo(() => {
    if (!screening) return { price: 0, total: 0 };
    const labels = selectedSeats;
    const seatMap = new Map(screening.seats.map((s) => [s.label, s]));
    const total = labels.reduce(
      (sum, label) => sum + (seatMap.get(label)?.price ?? 0),
      0,
    );
    return { price: total, total };
  }, [screening, selectedSeats]);

  const handleLock = async () => {
    if (!screening?._id || selectedSeats.length === 0) return;
    try {
      await lockSeatsAction(String(screening._id), selectedSeats);
      setLockedAt(Date.now());
      setTimeLeft(LOCK_SECONDS);
    } catch {
      // Error stored in the booking store.
    }
  };

  const handleRelease = async () => {
    if (!screening?._id || lockedAt === null) return;
    await unlockSeatsAction(String(screening._id), selectedSeats);
    setLockedAt(null);
    setSelectedSeats([]);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!screening?._id || selectedSeats.length === 0) return;

    let paymentScreenshotUrl: string | undefined;
    if (paymentMethod === "screenshot") {
      if (!screenshotFile) {
        clearError();
        return;
      }
      paymentScreenshotUrl = await uploadPaymentScreenshotAction(screenshotFile);
    }

    try {
      const booking = await createBookingAction({
        screeningId: String(screening._id),
        seats: selectedSeats,
        paymentMethod,
        paymentScreenshotUrl,
      });
      submittedRef.current = true;
      setSubmittedBooking({
        id: booking._id,
        seats: booking.seats.map((s) => s.label),
        total: booking.totalPrice,
      });
    } catch {
      // Error stored in the booking store.
    }
  };

  const formatTimeLeft = () => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  // ---- Success screen ----
  if (submittedBooking) {
    return (
      <div className="bg-slate-950 min-h-screen text-white pt-32 pb-20 selection:bg-red-600 selection:text-white">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="bg-slate-900/80 rounded-2xl border border-emerald-700/40 p-8 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950/50 border border-emerald-600/50 flex items-center justify-center mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl uppercase tracking-wide mb-2">
              Booking Submitted
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              Your seats are reserved pending confirmation from the cinema.
            </p>

            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 text-left mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  Booking Reference
                </span>
                <span className="font-mono text-xs text-slate-300 font-bold">
                  {submittedBooking.id}
                </span>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  Seats
                </span>
                <div className="flex gap-1.5">
                  {submittedBooking.seats.map((s) => (
                    <span
                      key={s}
                      className="text-xs font-bold text-red-500 bg-red-950/30 border border-red-600/40 px-2.5 py-0.5 rounded"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  Total
                </span>
                <span className="text-white font-bold">${submittedBooking.total}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all"
              >
                View My Bookings
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-5 py-2.5 rounded-lg transition-all"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Loading ----
  if (isScreeningLoading || !screening) {
    return (
      <div className="bg-slate-950 min-h-screen text-white flex flex-col items-center justify-center pt-24 pb-20">
        {screeningError ? (
          <div className="text-center max-w-md bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
            <Film className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-60" />
            <h3 className="font-display font-bold text-lg text-white mb-2 uppercase tracking-wide">
              Screening Unavailable
            </h3>
            <p className="text-slate-400 text-sm mb-6">{screeningError}</p>
            <button
              type="button"
              onClick={() => navigate("/movies")}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all"
            >
              Back to Movies
            </button>
          </div>
        ) : (
          <>
            <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
            <p className="text-slate-400 text-sm font-medium">Loading screening...</p>
          </>
        )}
      </div>
    );
  }

  const startTime = new Date(screening.startTime);

  // ---- Seat selection / checkout ----
  return (
    <div className="bg-slate-950 min-h-screen text-white pt-24 pb-20 selection:bg-red-600 selection:text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <SectionLabel>Select Your Seats</SectionLabel>
            <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wide">
              {movie?.title ?? "Screening"}
            </h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-slate-400 text-xs sm:text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                {format(startTime, "EEE, MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                {format(startTime, "h:mm a")}
              </span>
              {cinema && <span>{cinema.name}</span>}
              <span className="text-slate-500">· {screening.roomName}</span>
            </div>
          </div>

          {lockedAt !== null && (
            <div className="flex items-center gap-2 bg-red-950/40 border border-red-600/40 rounded-lg px-4 py-2.5">
              <Lock className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                  Seats held for
                </p>
                <p className="font-mono font-bold text-lg leading-none text-white">
                  {formatTimeLeft()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Seat map */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 sm:p-8 mb-6 shadow-xl overflow-x-auto">
          <div className="max-w-md mx-auto h-2.5 bg-slate-700/60 rounded-t-full mb-8" />
          <div className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em] mb-8">
            Screen
          </div>

          <div className="flex flex-col items-center gap-2 min-w-[480px]">
            {rows.map((row) => (
              <div key={row.row} className="flex items-center gap-1.5">
                <span className="w-5 text-right text-[10px] text-slate-500 font-bold">
                  {row.row}
                </span>
                {row.seats.map((seat) => {
                  const isSelected = selectedSeats.includes(seat.label);
                  const disabled = !canSelect(seat);
                  const isHeld = seat.status === "held";
                  return (
                    <button
                      key={seat.label}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleSeat(seat)}
                      title={`${seat.label} — $${seat.price}`}
                      className={`rounded-md flex items-center justify-center transition-all active:scale-95 ${
                        seat.isDouble ? "w-9 h-7" : "w-7 h-7"
                      } ${
                        isSelected
                          ? "bg-red-600 border-red-500 text-white shadow-md shadow-red-600/30"
                          : isHeld
                            ? "bg-amber-950/60 border border-amber-700/50 text-amber-600/70 cursor-not-allowed"
                            : seat.status === "booked"
                              ? "bg-slate-600/40 border border-slate-600/60 text-slate-600 cursor-not-allowed"
                              : "bg-slate-800 border border-slate-700 text-slate-400 hover:border-red-600/60 hover:text-white"
                      }`}
                    >
                      <Armchair className="w-4 h-4" />
                    </button>
                  );
                })}
                <span className="w-5 text-left text-[10px] text-slate-500 font-bold">
                  {row.row}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-slate-800 border border-slate-700" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-red-600" />
              Selected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-amber-950/60 border border-amber-700/50" />
              Held
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-slate-600/40 border border-slate-600/60" />
              Sold
            </span>
          </div>
        </div>

        {(bookingError || screeningError) && (
          <div className="mb-6 p-3 bg-red-950/50 border border-red-600/50 rounded-lg text-red-400 text-xs font-semibold flex items-center justify-between">
            <span>{bookingError || screeningError}</span>
            <button type="button" onClick={clearError} className="text-red-300 hover:text-white">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Checkout card */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Selected seats summary */}
            <div className="flex-1">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                Your Selection
              </p>
              {selectedSeats.length === 0 ? (
                <p className="text-slate-500 text-sm">
                  Tap seats on the map to add them to your booking.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedSeats.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() =>
                        setSelectedSeats((prev) => prev.filter((l) => l !== s))
                      }
                      className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-950/30 border border-red-600/40 px-2.5 py-1 rounded hover:bg-red-950/60 transition-colors"
                    >
                      {s} <XCircle className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-6 mt-5">
                <div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                    Seats
                  </p>
                  <p className="text-white font-bold text-lg">
                    {selectedSeats.length}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                    Total
                  </p>
                  <p className="text-white font-bold text-lg">
                    ${selectedDetails.total}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment / actions */}
            <div className="flex-1 border-t lg:border-t-0 lg:border-l border-slate-800 lg:pl-6 pt-5 lg:pt-0">
              {lockedAt === null ? (
                <button
                  type="button"
                  onClick={handleLock}
                  disabled={selectedSeats.length === 0 || isLocking}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-red-600 text-white font-semibold text-sm px-5 py-3 rounded-lg transition-all shadow-lg shadow-red-600/25"
                >
                  {isLocking ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  {selectedSeats.length === 0
                    ? "Select Seats to Continue"
                    : `Lock ${selectedSeats.length} Seat${selectedSeats.length > 1 ? "s" : ""} & Continue`}
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Payment method */}
                  <div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                      Payment Method
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("in_person")}
                        disabled={!allowPayInPerson}
                        className={`border rounded-lg px-3 py-2.5 text-xs font-semibold text-left transition-all ${
                          paymentMethod === "in_person"
                            ? "border-red-600 bg-red-950/30 text-white"
                            : "border-slate-800 bg-slate-950/40 text-slate-400"
                        } ${!allowPayInPerson ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        Pay at Cinema
                        {!allowPayInPerson && (
                          <p className="text-[10px] font-normal text-slate-500 mt-0.5">
                            Not available
                          </p>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("screenshot")}
                        className={`border rounded-lg px-3 py-2.5 text-xs font-semibold text-left transition-all ${
                          paymentMethod === "screenshot"
                            ? "border-red-600 bg-red-950/30 text-white"
                            : "border-slate-800 bg-slate-950/40 text-slate-400"
                        }`}
                      >
                        Payment Screenshot
                        <p className="text-[10px] font-normal text-slate-500 mt-0.5">
                          Upload proof of payment
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Screenshot upload */}
                  {paymentMethod === "screenshot" && (
                    <label className="flex items-center gap-3 bg-slate-950/60 border border-dashed border-slate-700 hover:border-red-600/50 rounded-lg px-4 py-3 cursor-pointer transition-colors">
                      <Upload className="w-4 h-4 text-slate-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-300 truncate">
                          {screenshotFile
                            ? screenshotFile.name
                            : "Upload payment screenshot"}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          JPG or PNG, proof of payment to the cinema.
                        </p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleScreenshotChange}
                      />
                    </label>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleRelease}
                      className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 px-4 py-3 rounded-lg transition-all"
                    >
                      <Unlock className="w-3.5 h-3.5" /> Release Seats
                    </button>
                    <button
                      type="submit"
                      disabled={
                        isBooking ||
                        isUploading ||
                        (paymentMethod === "screenshot" && !screenshotFile)
                      }
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-40 disabled:hover:bg-red-600 text-white font-semibold text-sm px-5 py-3 rounded-lg transition-all shadow-lg shadow-red-600/25"
                    >
                      {(isBooking || isUploading) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Ticket className="w-4 h-4" />
                      )}
                      {paymentMethod === "screenshot" && !screenshotFile
                        ? "Upload Screenshot to Continue"
                        : "Confirm Booking"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 mt-4 flex items-center gap-1.5">
          <Lock className="w-3 h-3" />
          Selected seats are held for 10 minutes while you complete payment. Seats
          not confirmed before then are released automatically.
        </p>
      </div>
    </div>
  );
}
