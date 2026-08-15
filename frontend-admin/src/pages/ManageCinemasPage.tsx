import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Loader2,
  Check,
  X,
  Trash2,
  AlertCircle,
  Building2,
  Eye,
} from "lucide-react";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import StatusBadge from "../components/ui/StatusBadge";
import { useCinemaStore } from "../stores/cinema.store";
import type { ICinema } from "../types/cinema.type";
import { useNavigate } from "react-router";

type StatusFilter = "ALL" | "pending" | "active" | "rejected";

export default function ManageCinemasPage() {
  const navigate = useNavigate();
  const {
    cinemas,
    count,
    isLoading,
    isSubmitting,
    error,
    getAllCinemasAction,
    approveCinemaAction,
    rejectCinemaAction,
    deleteCinemaAction,
    clearError,
  } = useCinemaStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [deleteTarget, setDeleteTarget] = useState<ICinema | null>(null);

  useEffect(() => {
    getAllCinemasAction();
  }, [getAllCinemasAction]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cinemas.filter((cinema) => {
      const matchSearch =
        !term ||
        cinema.name.toLowerCase().includes(term) ||
        cinema.address.city.toLowerCase().includes(term) ||
        cinema.address.country.toLowerCase().includes(term) ||
        cinema.email.toLowerCase().includes(term);
      const matchStatus =
        statusFilter === "ALL" || cinema.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [cinemas, search, statusFilter]);

  const handleApprove = async (cinema: ICinema) => {
    if (!cinema._id) return;
    try {
      await approveCinemaAction(String(cinema._id));
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  const handleReject = async (cinema: ICinema) => {
    if (!cinema._id) return;
    try {
      await rejectCinemaAction(String(cinema._id));
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      await deleteCinemaAction(String(deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1">
            Network
          </p>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wide">
            Manage Cinemas
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {count} registered cinema{count !== 1 ? "s" : ""}. Cinemas are
            submitted by cinema owners and approved here.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, city, or email..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600/60 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(["ALL", "pending", "active", "rejected"] as const).map((status) => (
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
      </div>

      {/* Error banner */}
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

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
          <p className="text-sm">Loading cinemas...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-60" />
          <h3 className="font-display font-bold text-lg text-white mb-1 uppercase tracking-wide">
            No cinemas found
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            No cinemas match your filters. New cinemas appear here once cinema
            owners submit them.
          </p>
        </div>
      ) : (
        /* Table */
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-[11px] font-bold uppercase tracking-widest border-b border-slate-800">
                  <th className="px-5 py-3.5">Cinema</th>
                  <th className="px-5 py-3.5 hidden md:table-cell">Location</th>
                  <th className="px-5 py-3.5 hidden lg:table-cell">Rooms</th>
                  <th className="px-5 py-3.5 hidden sm:table-cell">Contact</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((cinema) => (
                  <tr key={String(cinema._id)} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {cinema.images && cinema.images.length > 0 ? (
                          <img
                            src={cinema.images[0]}
                            alt={cinema.name}
                            className="w-12 h-9 object-cover rounded-md bg-slate-800 border border-slate-800 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-9 rounded-md bg-slate-800 border border-slate-800 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-[220px]">
                            {cinema.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[220px]">
                            Owner ID: {String(cinema.ownerId)}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {cinema.currency ?? "USD"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-slate-300">
                      <p className="truncate max-w-[180px]">
                        {cinema.address.city}, {cinema.address.country}
                      </p>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-slate-300">
                      {cinema.rooms?.length ?? 0}
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <p className="text-slate-300 truncate max-w-[180px]">
                        {cinema.email}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-[180px]">
                        {cinema.phone}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge label={cinema.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {(cinema.status === "pending" ||
                          cinema.status === "rejected") && (
                          <button
                            type="button"
                            onClick={() => navigate(`/cinemas/${String(cinema._id)}/review`)}
                            title="Review cinema"
                            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {cinema.status === "pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(cinema)}
                              disabled={isSubmitting}
                              title="Approve cinema"
                              className="p-2 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(cinema)}
                              disabled={isSubmitting}
                              title="Reject cinema"
                              className="p-2 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(cinema)}
                          title="Delete cinema"
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Cinema"
          message={`Are you sure you want to permanently delete "${deleteTarget.name}"? This action cannot be undone.`}
          isSubmitting={isSubmitting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
