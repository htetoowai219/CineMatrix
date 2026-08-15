import { useEffect, useMemo } from "react";
import { Link } from "react-router";
import {
  Clapperboard,
  Building2,
  Loader2,
  Sparkles,
  CalendarClock,
  ChevronRight,
  TrendingUp,
  Ticket,
} from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";
import { HBarList, VerticalBarChart } from "../components/ui/BarCharts";
import { useMovieStore } from "../stores/movie.store";
import { useCinemaStore } from "../stores/cinema.store";
import { useBookingStore } from "../stores/booking.store";

export default function DashboardPage() {
  const { movies, isLoading: moviesLoading, getAllMoviesAction } = useMovieStore();
  const { cinemas, isLoading: cinemasLoading, getAllCinemasAction } = useCinemaStore();
  const {
    bookings,
    isLoading: bookingsLoading,
    getBookingsAction,
  } = useBookingStore();

  useEffect(() => {
    getAllMoviesAction();
    getAllCinemasAction();
    getBookingsAction();
  }, [getAllMoviesAction, getAllCinemasAction, getBookingsAction]);

  const nowShowing = movies.filter((m) => m.status === "NOW_SHOWING").length;
  const upcoming = movies.filter((m) => m.status === "UPCOMING").length;
  const activeCinemas = cinemas.filter((c) => c.status === "active").length;
  const pendingCinemas = cinemas.filter((c) => c.status === "pending").length;
  const isLoading = moviesLoading || cinemasLoading || bookingsLoading;

  // Bookings per day for the last 7 days.
  const bookingsLast7Days = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d.getTime() + 86400000);
      const count = bookings.filter((b) => {
        const t = new Date(b.createdAt ?? b.screeningId.startTime);
        return t.getTime() >= d.getTime() && t.getTime() < next.getTime();
      }).length;
      days.push({ label: d.toLocaleDateString("en-US", { weekday: "short" }), value: count });
    }
    return days;
  }, [bookings]);

  // Movies grouped by status.
  const moviesByStatus = useMemo(() => {
    const statuses = ["NOW_SHOWING", "UPCOMING", "PENDING_APPROVAL", "ARCHIVED"] as const;
    const colors: Record<string, string> = {
      NOW_SHOWING: "#10b981",
      UPCOMING: "#f59e0b",
      PENDING_APPROVAL: "#38bdf8",
      ARCHIVED: "#64748b",
    };
    return statuses.map((status) => ({
      label: status,
      value: movies.filter((m) => m.status === status).length,
      color: colors[status],
    }));
  }, [movies]);

  // Cinemas grouped by status.
  const cinemasByStatus = useMemo(() => {
    const statuses = ["pending", "active", "rejected"] as const;
    const colors: Record<string, string> = {
      pending: "#f59e0b",
      active: "#10b981",
      rejected: "#ef4444",
    };
    return statuses.map((status) => ({
      label: status,
      value: cinemas.filter((c) => c.status === status).length,
      color: colors[status],
    }));
  }, [cinemas]);

  const stats = [
    {
      label: "Total Movies",
      value: movies.length,
      icon: Clapperboard,
      accent: "text-red-500 bg-red-950/40 border-red-600/40",
    },
    {
      label: "Now Showing",
      value: nowShowing,
      icon: Sparkles,
      accent: "text-emerald-400 bg-emerald-950/40 border-emerald-600/40",
    },
    {
      label: "Upcoming Releases",
      value: upcoming,
      icon: CalendarClock,
      accent: "text-amber-400 bg-amber-950/40 border-amber-600/40",
    },
    {
      label: "Registered Cinemas",
      value: cinemas.length,
      icon: Building2,
      accent: "text-sky-400 bg-sky-950/40 border-sky-600/40",
    },
  ];

  const recentMovies = movies.slice(0, 5);
  const recentCinemas = cinemas.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1">
          Overview
        </p>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wide">
          Dashboard
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          A snapshot of your movie catalog and cinema network.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
          <p className="text-sm">Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {stats.map(({ label, value, icon: Icon, accent }) => (
              <div
                key={label}
                className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-display font-black text-3xl text-white">{value}</p>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent movies */}
            <section className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-bold text-white uppercase tracking-wide text-lg">
                    Recent Movies
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {activeCinemas} active cinema{activeCinemas !== 1 ? "s" : ""}
                  </p>
                </div>
                <Link
                  to="/movies"
                  className="flex items-center gap-1 text-red-500 text-xs font-bold hover:text-red-400 transition-colors"
                >
                  Manage <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentMovies.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center">
                  No movies yet. Add your first title from the Movies tab.
                </p>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {recentMovies.map((movie) => (
                    <li key={String(movie._id)} className="flex items-center gap-3 py-3">
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-10 h-14 object-cover rounded-md bg-slate-800 border border-slate-800 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">
                          {movie.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {movie.durationMinutes}m · {movie.contentRating}
                        </p>
                      </div>
                      {movie.status && <StatusBadge label={movie.status} />}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Recent cinemas */}
            <section className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-bold text-white uppercase tracking-wide text-lg">
                    Recent Cinemas
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {activeCinemas} active / {cinemas.length} total
                  </p>
                </div>
                <Link
                  to="/cinemas"
                  className="flex items-center gap-1 text-red-500 text-xs font-bold hover:text-red-400 transition-colors"
                >
                  Manage <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {recentCinemas.length === 0 ? (
                <p className="text-slate-500 text-sm py-8 text-center">
                  No cinemas yet. Onboard your first venue from the Cinemas tab.
                </p>
              ) : (
                <ul className="divide-y divide-slate-800">
                  {recentCinemas.map((cinema) => (
                    <li key={String(cinema._id)} className="flex items-center gap-3 py-3">
                      <div className="w-10 h-14 rounded-md bg-slate-800 border border-slate-800 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">
                          {cinema.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {cinema.address.city}, {cinema.address.country} ·{" "}
                          {cinema.rooms?.length ?? 0} rooms
                        </p>
                      </div>
                      <StatusBadge label={cinema.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <section className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <h2 className="font-display font-bold text-white uppercase tracking-wide text-lg">
                  Network Activity
                </h2>
              </div>
              {bookings.length === 0 ? (
                <p className="text-slate-400 text-sm py-6 text-center">
                  Booking data will appear here once customers start booking.
                </p>
              ) : (
                <VerticalBarChart data={bookingsLast7Days} />
              )}
              <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1.5">
                <Ticket className="w-3 h-3" />
                Bookings created in the last 7 days
              </p>
            </section>

            <section className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-display font-bold text-white uppercase tracking-wide text-lg">
                  Catalog Health
                </h2>
                <span className="text-[11px] text-slate-500 font-semibold">
                  {pendingCinemas} cinemas awaiting approval
                </span>
              </div>
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Movies by status
                  </p>
                  <HBarList data={moviesByStatus} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Cinemas by status
                  </p>
                  <HBarList data={cinemasByStatus} />
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
