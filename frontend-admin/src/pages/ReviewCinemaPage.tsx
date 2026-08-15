import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import {
  Loader2,
  AlertCircle,
  Building2,
  ArrowLeft,
  Check,
  X,
  MapPin,
  Phone,
  Mail,
  Globe,
  CalendarClock,
} from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";
import { useCinemaStore } from "../stores/cinema.store";
import type { ICinemaRoom, SeatCellType } from "../types/cinema.type";

const MINI_STYLES: Record<SeatCellType, string> = {
  seat: "bg-red-600/70",
  double: "bg-rose-600/70",
  walkway: "bg-slate-700/40",
  stairs: "bg-amber-500/60",
  empty: "bg-slate-900",
};

const RoomGrid = ({ grid }: { grid: SeatCellType[][] }) => (
  <div className="flex flex-col gap-0.5">
    {grid.map((rowArr, r) => (
      <div key={r} className="flex gap-0.5">
        {rowArr.map((cell, c) => (
          <span
            key={c}
            className={`w-2 h-2 rounded-[2px] ${MINI_STYLES[cell]}`}
          />
        ))}
      </div>
    ))}
  </div>
);

const detailBlock = (
  label: string,
  value: string | React.ReactNode,
) => (
  <div>
    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-0.5">
      {label}
    </p>
    <div className="text-slate-200 text-sm font-semibold">{value ?? "—"}</div>
  </div>
);

const detailRow = (
  label: string,
  value: string | undefined,
  Icon: typeof MapPin,
) => (
  <div className="flex items-center gap-2.5">
    <Icon className="w-4 h-4 text-slate-500 shrink-0" />
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
        {label}
      </p>
      <p className="text-sm text-slate-200 truncate">{value || "—"}</p>
    </div>
  </div>
);

export default function ReviewCinemaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    selectedCinema,
    isLoading,
    isSubmitting,
    error,
    getCinemaByIdAction,
    approveCinemaAction,
    rejectCinemaAction,
    clearError,
  } = useCinemaStore();

  useEffect(() => {
    if (id) getCinemaByIdAction(id);
  }, [id, getCinemaByIdAction]);

  const cinema = selectedCinema;

  const handleApprove = async () => {
    if (!cinema?._id) return;
    try {
      await approveCinemaAction(String(cinema._id));
      navigate("/cinemas");
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  const handleReject = async () => {
    if (!cinema?._id) return;
    try {
      await rejectCinemaAction(String(cinema._id));
      navigate("/cinemas");
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  const rooms = cinema?.rooms ?? [];

  return (
    <div className="max-w-5xl mx-auto">
      <button
        type="button"
        onClick={() => navigate("/cinemas")}
        className="mb-4 flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Manage Cinemas
      </button>

      {error && (
        <div className="mb-6 p-4 bg-red-950/50 border border-red-800 rounded-lg flex items-center justify-between text-red-200 text-sm">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            {error}
          </span>
          <button
            type="button"
            onClick={clearError}
            className="text-xs bg-red-900 hover:bg-red-800 px-3 py-1 rounded transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
          <p className="text-sm">Loading cinema for review...</p>
        </div>
      ) : !cinema ? (
        <div className="text-center py-24 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-60" />
          <h3 className="font-display font-bold text-lg text-white mb-1 uppercase tracking-wide">
            Cinema not found
          </h3>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-6">
            <div className="h-40 sm:h-52 relative">
              {cinema.images && cinema.images.length > 0 ? (
                <img
                  src={cinema.images[0]}
                  alt={cinema.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                  <Building2 className="w-12 h-12 text-slate-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
            </div>
            <div className="p-5 sm:p-6 -mt-12 relative">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <h1 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-wide">
                      {cinema.name}
                    </h1>
                    <StatusBadge label={cinema.status} />
                  </div>
                  <p className="text-slate-400 text-sm">
                    {cinema.address.city}, {cinema.address.country} ·{" "}
                    {cinema.currency ?? "USD"} ·{" "}
                    {cinema.allowPayInPerson ? "Pay-in-person on" : "Online payment only"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-950/60 border border-amber-600/40 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 px-4 py-2.5 rounded-lg transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
              Cinema details
            </p>
            {cinema.description && (
              <p className="text-slate-300 text-sm leading-relaxed mb-4">
                {cinema.description}
              </p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {detailRow("Address", `${cinema.address.street}, ${cinema.address.city}${cinema.address.state ? `, ${cinema.address.state}` : ""}, ${cinema.address.country}`, MapPin)}
                {detailRow("Phone", cinema.phone, Phone)}
                {detailRow("Email", cinema.email, Mail)}
                {detailRow("Website", cinema.socials?.website, Globe)}
              </div>
              {detailBlock("Owner ID", String(cinema.ownerId))}
              {detailBlock("Ticket currency", cinema.currency ?? "USD")}
              {detailBlock(
                "Payments",
                cinema.allowPayInPerson ? "Pay-at-cinema enabled" : "Screenshot payments only",
              )}
              {detailBlock(
                "Rooms",
                `${rooms.length} room${rooms.length !== 1 ? "s" : ""}`,
              )}
              {detailBlock("Created", cinema.createdAt ? new Date(cinema.createdAt).toLocaleDateString() : "—")}
            </div>
          </div>

          {/* Rooms & layouts */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 mb-6">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
              Room layouts
            </p>
            {rooms.length === 0 ? (
              <p className="text-slate-400 text-sm">
                No room layouts have been configured yet.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {rooms.map((room: ICinemaRoom, index: number) => (
                  <div
                    key={`${room.name}-${index}`}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex gap-5"
                  >
                    <RoomGrid grid={room.grid} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{room.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {room.rows} rows × {room.cols} cols
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gallery */}
          {(cinema.gallery && cinema.gallery.length > 0) ||
          (cinema.images && cinema.images.length > 1) ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">
                Gallery
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(cinema.gallery?.length ? cinema.gallery : cinema.images ?? [])
                  .filter((_, i) => i !== 0)
                  .map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`${cinema.name} gallery ${i + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-slate-800"
                    />
                  ))}
              </div>
            </div>
          ) : null}

          <p className="text-[11px] text-slate-500 mt-6 flex items-center gap-1.5">
            <CalendarClock className="w-3 h-3" />
            Approving publishes the cinema publicly. Rejecting keeps it hidden so
            the owner can revise and resubmit.
          </p>
        </>
      )}
    </div>
  );
}
