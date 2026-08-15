import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Loader2,
  AlertCircle,
  Ticket,
  Check,
  X,
  Image as ImageIcon,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import StatusBadge from "../components/ui/StatusBadge";
import { useBookingStore } from "../stores/booking.store";
import { useCinemaStore } from "../stores/cinema.store";
import { formatCurrency } from "../utils/currency";
import type { IBooking } from "../types/booking.type";

type StatusFilter = "ALL" | "pending" | "confirmed" | "rejected" | "cancelled";

const STATUS_TABS: StatusFilter[] = [
  "ALL",
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
];

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

export default function BookingsPage() {
  const { cinemaId: routeCinemaId } = useParams<{ cinemaId: string }>();
  const navigate = useNavigate();
  const {
    bookings,
    isLoading,
    isSubmitting,
    error,
    getBookingsAction,
    updateBookingStatusAction,
    clearError,
  } = useBookingStore();
  const { myCinemas, getMyCinemasAction } = useCinemaStore();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [filterCinema, setFilterCinema] = useState<string>(
    routeCinemaId ?? "ALL",
  );
  const [viewScreenshot, setViewScreenshot] = useState<IBooking | null>(null);
  const [actionTarget, setActionTarget] = useState<{
    booking: IBooking;
    action: "approve" | "reject";
  } | null>(null);

  useEffect(() => {
    getBookingsAction();
    getMyCinemasAction();
  }, [getBookingsAction, getMyCinemasAction]);

  const activeFilter = routeCinemaId ?? filterCinema;

  const selectFilter = (cinemaId: string) => {
    setFilterCinema(cinemaId);
    if (routeCinemaId) navigate("/bookings");
  };

  const filtered = useMemo(() => {
    return bookings.filter((booking) => {
      const matchStatus =
        statusFilter === "ALL" || booking.status === statusFilter;
      const matchCinema =
        activeFilter === "ALL" ||
        String(booking.screeningId.cinemaId._id) === activeFilter;
      return matchStatus && matchCinema;
    });
  }, [bookings, statusFilter, activeFilter]);

  const pendingCount = useMemo(
    () => bookings.filter((b) => b.status === "pending").length,
    [bookings],
  );

  const handleAction = async () => {
    if (!actionTarget) return;
    try {
      await updateBookingStatusAction(
        String(actionTarget.booking._id),
        actionTarget.action,
      );
      setActionTarget(null);
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1">
            Partner Portal
          </p>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wide">
            Bookings
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {pendingCount} pending booking{pendingCount !== 1 ? "s" : ""}{" "}
            awaiting your decision.
          </p>
        </div>
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

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`text-xs px-3.5 py-2 rounded-full border transition-all whitespace-nowrap shrink-0 ${
                statusFilter === status
                  ? "bg-red-600 border-red-600 text-white font-bold"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
              }`}
            >
              {status === "ALL" ? "All" : status}
            </button>
          ))}
        </div>
        <select
          value={activeFilter}
          onChange={(e) => selectFilter(e.target.value)}
          className="md:ml-auto bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-red-600/60 transition-all"
        >
          <option value="ALL">All Cinemas</option>
          {myCinemas.map((cinema) => (
            <option key={String(cinema._id)} value={String(cinema._id)}>
              {cinema.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
          <p className="text-sm">Loading bookings...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
          <Ticket className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-60" />
          <h3 className="font-display font-bold text-lg text-white mb-1 uppercase tracking-wide">
            No bookings found
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Customer bookings across your cinemas appear here.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-[11px] font-bold uppercase tracking-widest border-b border-slate-800">
                  <th className="px-5 py-3.5">Movie</th>
                  <th className="px-5 py-3.5 hidden lg:table-cell">Customer</th>
                  <th className="px-5 py-3.5">When</th>
                  <th className="px-5 py-3.5 hidden md:table-cell">Seats</th>
                  <th className="px-5 py-3.5">Total</th>
                  <th className="px-5 py-3.5 hidden sm:table-cell">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((booking) => (
                  <tr
                    key={String(booking._id)}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate max-w-[200px]">
                          {booking.screeningId.movieId?.title ?? "Unknown movie"}
                        </p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">
                          {booking.screeningId.cinemaId?.name} ·{" "}
                          {booking.screeningId.roomName}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <p className="text-slate-300 truncate max-w-[160px]">
                        {booking.userId.name ?? "Customer"}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-[160px]">
                        {booking.userId.email}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 whitespace-nowrap">
                      {formatDate(booking.screeningId.startTime)}
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-slate-300 whitespace-nowrap">
                        {booking.seats.map((s) => s.label).join(", ")}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-white whitespace-nowrap">
                      {formatCurrency(
                        booking.totalPrice,
                        booking.screeningId.cinemaId?.currency,
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <StatusBadge label={booking.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {booking.paymentScreenshotUrl && (
                          <button
                            type="button"
                            onClick={() => setViewScreenshot(booking)}
                            title="View payment screenshot"
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                        )}
                        {booking.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setActionTarget({
                                  booking,
                                  action: "approve",
                                })
                              }
                              disabled={isSubmitting}
                              title="Confirm booking"
                              className="p-2 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setActionTarget({
                                  booking,
                                  action: "reject",
                                })
                              }
                              disabled={isSubmitting}
                              title="Reject booking"
                              className="p-2 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Screenshot modal */}
      {viewScreenshot && (
        <Modal
          title="Payment Screenshot"
          subtitle={`${viewScreenshot.userId?.name ?? "Customer"} · ${formatCurrency(
            viewScreenshot.totalPrice,
            viewScreenshot.screeningId.cinemaId?.currency,
          )}`}
          onClose={() => setViewScreenshot(null)}
          maxWidth="max-w-lg"
        >
          {viewScreenshot.paymentScreenshotUrl ? (
            <img
              src={viewScreenshot.paymentScreenshotUrl}
              alt="Payment screenshot"
              className="w-full rounded-xl border border-slate-800"
            />
          ) : (
            <p className="text-slate-400 text-sm">No screenshot uploaded.</p>
          )}
        </Modal>
      )}

      {/* Approve/reject confirmation */}
      {actionTarget && (
        <ConfirmDialog
          title={actionTarget.action === "approve" ? "Confirm Booking" : "Reject Booking"}
          message={
            actionTarget.action === "approve"
              ? `Confirm this booking for "${actionTarget.booking.screeningId.movieId?.title ?? ""}"? Seats will be marked as sold.`
              : `Reject this booking? Its seats will be released back for sale.`
          }
          confirmLabel={actionTarget.action === "approve" ? "Confirm Booking" : "Reject Booking"}
          isSubmitting={isSubmitting}
          onConfirm={handleAction}
          onCancel={() => setActionTarget(null)}
        />
      )}
    </div>
  );
}
