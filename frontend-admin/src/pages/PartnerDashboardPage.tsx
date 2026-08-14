import { useEffect } from "react";
import { Link } from "react-router";
import {
  Building2,
  Loader2,
  Ticket,
  CalendarClock,
  Clapperboard,
  ChevronRight,
} from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";
import { useCinemaStore } from "../stores/cinema.store";
import { useBookingStore } from "../stores/booking.store";
import { useScreeningStore } from "../stores/screening.store";
import { useTemplateStore } from "../stores/template.store";

export default function PartnerDashboardPage() {
  const { myCinemas, isLoading: cinemasLoading, getMyCinemasAction } =
    useCinemaStore();
  const { bookings, isLoading: bookingsLoading, getBookingsAction } =
    useBookingStore();
  const {
    screenings,
    isLoading: screeningsLoading,
    getScreeningsAction,
  } = useScreeningStore();
  const { templates, isLoading: templatesLoading, getTemplatesAction } =
    useTemplateStore();

  useEffect(() => {
    getMyCinemasAction();
    getBookingsAction();
    getScreeningsAction();
    getTemplatesAction();
  }, [getMyCinemasAction, getBookingsAction, getScreeningsAction, getTemplatesAction]);

  const pendingBookings = bookings.filter((b) => b.status === "pending").length;
  const totalScreenings = screenings.length;
  const pendingCinemas = myCinemas.filter((c) => c.status === "pending").length;

  const isLoading =
    cinemasLoading || bookingsLoading || screeningsLoading || templatesLoading;

  const stats = [
    {
      label: "My Cinemas",
      value: myCinemas.length,
      to: "/my-cinemas",
      icon: Building2,
      accent: "text-sky-400 bg-sky-950/40 border-sky-600/40",
    },
    {
      label: "Pending Bookings",
      value: pendingBookings,
      to: "/bookings",
      icon: Ticket,
      accent: "text-amber-400 bg-amber-950/40 border-amber-600/40",
    },
    {
      label: "Screenings Scheduled",
      value: totalScreenings,
      to: "/screenings",
      icon: CalendarClock,
      accent: "text-emerald-400 bg-emerald-950/40 border-emerald-600/40",
    },
    {
      label: "Templates",
      value: templates.length,
      to: "/templates",
      icon: Clapperboard,
      accent: "text-red-500 bg-red-950/40 border-red-600/40",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1">
          Overview
        </p>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wide">
          Dashboard
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Your cinema network at a glance.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
          <p className="text-sm">Loading dashboard...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {stats.map(({ label, value, to, icon: Icon, accent }) => (
              <Link
                key={label}
                to={to}
                className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl hover:border-slate-700 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-display font-black text-3xl text-white">{value}</p>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mt-1">
                  {label}
                </p>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My cinemas */}
            <section className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-bold text-white uppercase tracking-wide text-lg">
                    My Cinemas
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {pendingCinemas} pending approval
                  </p>
                </div>
                <Link
                  to="/my-cinemas"
                  className="flex items-center gap-1 text-red-500 text-xs font-bold hover:text-red-400 transition-colors"
                >
                  Manage <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {myCinemas.length === 0 ? (
                <p className="text-slate-400 text-sm py-6 text-center">
                  No cinemas yet.
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-slate-800">
                  {myCinemas.slice(0, 5).map((cinema) => (
                    <Link
                      key={String(cinema._id)}
                      to={`/cinemas/${String(cinema._id)}`}
                      className="flex items-center justify-between py-3 gap-3 hover:text-red-400 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">
                          {cinema.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {cinema.address.city} · {cinema.rooms?.length ?? 0} rooms
                        </p>
                      </div>
                      <StatusBadge label={cinema.status} />
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* Pending bookings */}
            <section className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display font-bold text-white uppercase tracking-wide text-lg">
                    Recent Bookings
                  </h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Latest customer activity
                  </p>
                </div>
                <Link
                  to="/bookings"
                  className="flex items-center gap-1 text-red-500 text-xs font-bold hover:text-red-400 transition-colors"
                >
                  Review <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {bookings.length === 0 ? (
                <p className="text-slate-400 text-sm py-6 text-center">
                  No bookings yet.
                </p>
              ) : (
                <div className="flex flex-col divide-y divide-slate-800">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={String(booking._id)} className="flex items-center justify-between py-3 gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm truncate">
                          {booking.screeningId.movieId?.title ?? "Unknown movie"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {booking.userId.name ?? "Customer"} · {booking.seats.length} seat
                          {booking.seats.length !== 1 ? "s" : ""} · $
                          {Number(booking.totalPrice).toFixed(2)}
                        </p>
                      </div>
                      <StatusBadge label={booking.status} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
