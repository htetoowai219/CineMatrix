import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Loader2,
  AlertCircle,
  CalendarClock,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useScreeningStore } from "../stores/screening.store";
import { useTemplateStore } from "../stores/template.store";
import { useCinemaStore } from "../stores/cinema.store";
import type { IScreening } from "../types/screening.type";

const formatDate = (value?: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const toLocalInput = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

export default function ScreeningsPage() {
  const { cinemaId: routeCinemaId } = useParams<{ cinemaId: string }>();
  const navigate = useNavigate();
  const {
    screenings,
    isLoading,
    isSubmitting,
    error,
    getScreeningsAction,
    createScreeningAction,
    updateScreeningAction,
    deleteScreeningAction,
    clearError,
  } = useScreeningStore();
  const { templates, getTemplatesAction } = useTemplateStore();
  const { myCinemas, getMyCinemasAction } = useCinemaStore();

  const [filterCinema, setFilterCinema] = useState<string>(
    routeCinemaId ?? "ALL",
  );
  const [showCreate, setShowCreate] = useState(false);
  const [rescheduling, setRescheduling] = useState<IScreening | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IScreening | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [startTime, setStartTime] = useState("");

  useEffect(() => {
    getScreeningsAction();
    getTemplatesAction();
    getMyCinemasAction();
  }, [getScreeningsAction, getTemplatesAction, getMyCinemasAction]);

  const activeFilter = routeCinemaId ?? filterCinema;

  const selectFilter = (cinemaId: string) => {
    setFilterCinema(cinemaId);
    if (routeCinemaId) navigate("/screenings");
  };

  const filtered = useMemo(() => {
    if (activeFilter === "ALL") return screenings;
    return screenings.filter((s) => s.cinemaId === activeFilter);
  }, [screenings, activeFilter]);

  const templateOptions = useMemo(() => {
    if (activeFilter === "ALL") return templates;
    return templates.filter((t) => t.cinemaId === activeFilter);
  }, [templates, activeFilter]);

  const openCreate = () => {
    setTemplateId("");
    setStartTime("");
    setShowCreate(true);
  };

  const openReschedule = (screening: IScreening) => {
    setRescheduling(screening);
    setStartTime(toLocalInput(screening.startTime));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId || !startTime) return;
    try {
      await createScreeningAction({ templateId, startTime });
      setShowCreate(false);
      setTemplateId("");
      setStartTime("");
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  const handleReschedule = async () => {
    if (!rescheduling?._id || !startTime) return;
    try {
      await updateScreeningAction(String(rescheduling._id), { startTime });
      setRescheduling(null);
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      await deleteScreeningAction(String(deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  const seatSummary = (screening: IScreening) => {
    const counts = { available: 0, held: 0, booked: 0 };
    screening.seats.forEach((seat) => {
      counts[seat.status] = (counts[seat.status] ?? 0) + 1;
    });
    return counts;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1">
            Partner Portal
          </p>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wide">
            Screenings
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Schedule movie showings from your templates and track seat
            availability.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Screening
        </button>
      </div>

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

      {/* Cinema filter */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => selectFilter("ALL")}
          className={`text-xs px-3.5 py-2 rounded-full border transition-all whitespace-nowrap shrink-0 ${
            activeFilter === "ALL"
              ? "bg-red-600 border-red-600 text-white font-bold"
              : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
          }`}
        >
          All Cinemas
        </button>
        {myCinemas.map((cinema) => (
          <button
            key={String(cinema._id)}
            type="button"
            onClick={() => selectFilter(String(cinema._id))}
            className={`text-xs px-3.5 py-2 rounded-full border transition-all whitespace-nowrap shrink-0 ${
              activeFilter === cinema._id
                ? "bg-red-600 border-red-600 text-white font-bold"
                : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
            }`}
          >
            {cinema.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
          <p className="text-sm">Loading screenings...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
          <CalendarClock className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-60" />
          <h3 className="font-display font-bold text-lg text-white mb-1 uppercase tracking-wide">
            No screenings found
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Create a template first, then schedule a screening from it.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-[11px] font-bold uppercase tracking-widest border-b border-slate-800">
                  <th className="px-5 py-3.5">Movie</th>
                  <th className="px-5 py-3.5 hidden md:table-cell">Cinema</th>
                  <th className="px-5 py-3.5">When</th>
                  <th className="px-5 py-3.5 hidden sm:table-cell">Room</th>
                  <th className="px-5 py-3.5 hidden lg:table-cell">Seats</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((screening) => {
                  const counts = seatSummary(screening);
                  return (
                    <tr
                      key={String(screening._id)}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {screening.movie?.posterUrl ? (
                            <img
                              src={screening.movie.posterUrl}
                              alt={screening.movie.title}
                              className="w-9 h-13 object-cover rounded-md border border-slate-800 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-13 rounded-md bg-slate-800 flex items-center justify-center shrink-0">
                              <CalendarClock className="w-4 h-4 text-slate-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate max-w-[200px]">
                              {screening.movie?.title ?? "Unknown movie"}
                            </p>
                            <p className="text-xs text-slate-500">
                              Ends {formatDate(screening.endTime)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell text-slate-300 truncate max-w-[180px]">
                        {screening.cinema?.name ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 whitespace-nowrap">
                        {formatDate(screening.startTime)}
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell text-slate-300">
                        {screening.roomName}
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1.5 text-[10px] font-semibold">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-950/40 border border-emerald-600/40 text-emerald-400">
                            {counts.available} free
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-amber-950/40 border border-amber-600/40 text-amber-400">
                            {counts.held} held
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-red-950/40 border border-red-600/40 text-red-400">
                            {counts.booked} sold
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openReschedule(screening)}
                            title="Reschedule"
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(screening)}
                            title="Delete screening"
                            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-950/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal
          title="New Screening"
          subtitle="Schedule a showing from an existing template."
          onClose={() => setShowCreate(false)}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                Template <span className="text-red-500">*</span>
              </label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/60 transition-all disabled:opacity-50"
                disabled={isSubmitting}
                required
              >
                <option value="" disabled>
                  Select template
                </option>
                {templateOptions.map((template) => (
                  <option key={String(template._id)} value={String(template._id)}>
                    {template.movie?.title ?? "Movie"} · {template.roomName} ·{" "}
                    {template.cinema?.name ?? "Cinema"}
                  </option>
                ))}
              </select>
              {templateOptions.length === 0 && (
                <p className="text-[11px] text-amber-400 mt-1.5">
                  No templates for this cinema. Create one first.
                </p>
              )}
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                Start time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/60 transition-all disabled:opacity-50"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || templateOptions.length === 0}
                className="bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20 flex items-center gap-2"
              >
                {isSubmitting && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Schedule Screening
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reschedule modal */}
      {rescheduling && (
        <Modal
          title="Reschedule Screening"
          subtitle={
            rescheduling.movie?.title
              ? `${rescheduling.movie.title} · ${rescheduling.roomName}`
              : "Update the start time"
          }
          onClose={() => setRescheduling(null)}
          maxWidth="max-w-lg"
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                New start time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/60 transition-all"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRescheduling(null)}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReschedule}
                disabled={isSubmitting || !startTime}
                className="bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20 flex items-center gap-2"
              >
                {isSubmitting && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Save New Time
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Screening"
          message={`Delete this screening of "${deleteTarget.movie?.title ?? ""}"? Bookings on it will be affected.`}
          isSubmitting={isSubmitting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
