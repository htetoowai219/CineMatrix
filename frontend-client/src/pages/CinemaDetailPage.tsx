import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  MapPin,
  Ticket,
  ArrowLeft,
  Film,
  Globe,
  Loader2,
  Clock,
} from "lucide-react";
import { addDays, format } from "date-fns";
import { useCinemaStore } from "../stores/cinema.store";
import { useScreeningStore } from "../stores/screening.store";
import type { IScreening } from "../types/booking.type";
import { formatCurrency } from "../utils/currency";

const getMovie = (s: IScreening) =>
  typeof s.movieId === "object" && s.movieId ? s.movieId : null;

const formatRuntime = (minutes?: number) =>
  minutes ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : "";

// Reliable Unsplash cinema image placeholders
const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80";

const DEFAULT_GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=800&q=80",
];

export default function CinemaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { selectedCinema, isLoading, error, getCinemaByIdAction, clearError } =
    useCinemaStore();
  const {
    screenings,
    isLoading: scheduleLoading,
    error: scheduleError,
    getPublicScreeningsAction,
    clearError: clearScreeningError,
  } = useScreeningStore();

  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    if (id) {
      getCinemaByIdAction(id);
    }
  }, [id, getCinemaByIdAction]);

  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // Loads the day's screenings for this cinema whenever the cinema or the
  // selected day changes.
  useEffect(() => {
    if (!selectedCinema) return;
    clearScreeningError();
    void getPublicScreeningsAction({
      cinemaId: String(selectedCinema._id),
      date: format(addDays(new Date(), activeDay), "yyyy-MM-dd"),
      limit: 100,
    });
  }, [
    selectedCinema,
    activeDay,
    getPublicScreeningsAction,
    clearScreeningError,
  ]);

  // Groups the day's screenings by movie for the schedule list.
  const movieGroups = useMemo(() => {
    const map = new Map<string, IScreening[]>();
    for (const screening of screenings) {
      const movie = getMovie(screening);
      const key = movie ? String(movie._id) : String(screening.movieId);
      const list = map.get(key) ?? [];
      list.push(screening);
      map.set(key, list);
    }
    return Array.from(map.values());
  }, [screenings]);

  const galleryImages =
    selectedCinema?.gallery && selectedCinema.gallery.length > 0
      ? selectedCinema.gallery
      : selectedCinema?.images && selectedCinema.images.length > 0
        ? selectedCinema.images
        : DEFAULT_GALLERY_IMAGES;

  const heroImage =
    selectedCinema?.images?.[0] || galleryImages[0] || DEFAULT_HERO_IMAGE;

  const formattedAddress = selectedCinema?.address
    ? `${selectedCinema.address.street}, ${selectedCinema.address.city}, ${selectedCinema.address.state ? selectedCinema.address.state + " " : ""}${selectedCinema.address.country}`
    : "Address unavailable";

  const cinemaCurrency = selectedCinema?.currency;

  if (isLoading && !selectedCinema) {
    return (
      <div className="bg-slate-950 min-h-screen text-white flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
        <p className="text-sm text-slate-400">Loading cinema details...</p>
      </div>
    );
  }

  if (error || !selectedCinema) {
    return (
      <div className="bg-slate-950 min-h-screen text-white flex flex-col items-center justify-center p-6 text-center">
        <Film className="w-12 h-12 text-slate-600 mb-4 opacity-60" />
        <h2 className="font-display font-bold text-xl uppercase tracking-wide mb-2">
          Cinema Not Found
        </h2>
        <p className="text-slate-400 text-sm max-w-md mb-6">
          {error || "We couldn't locate the cinema you're looking for."}
        </p>
        <button
          type="button"
          onClick={() => {
            clearError();
            navigate("/cinemas");
          }}
          className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all"
        >
          Back to All Cinemas
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen text-white selection:bg-red-600 selection:text-white">
      {/* Hero Header Image */}
      <div className="relative h-[35vh] sm:h-[45vh] min-h-[280px] max-h-[500px] overflow-hidden bg-slate-900">
        <img
          src={heroImage}
          alt=""
          className="w-full h-full object-cover opacity-35 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 to-transparent" />

        <button
          type="button"
          onClick={() => navigate("/cinemas")}
          className="absolute top-16 sm:top-24 left-4 sm:left-6 flex items-center gap-2 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors z-20 drop-shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> All Cinemas
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-20 sm:-mt-32 relative z-10 pb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="text-slate-400 text-xs sm:text-sm font-medium">
                {selectedCinema.rooms?.length ?? 0} rooms
              </span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-white uppercase tracking-tight leading-none mb-2">
              {selectedCinema.name}
            </h1>

            <div className="flex items-center gap-1.5 text-slate-400 text-xs sm:text-sm">
              <MapPin className="w-4 h-4 text-red-500 shrink-0" />
              <span>{formattedAddress}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById("daily-schedule");
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-all shadow-lg shadow-red-600/25 shrink-0 self-start md:self-auto"
          >
            <Ticket className="w-4 h-4" /> Book a Seat
          </button>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Description */}
            {selectedCinema.description && (
              <div className="bg-slate-900/80 rounded-xl border border-slate-800/90 p-5">
                <h3 className="font-display font-bold text-white uppercase tracking-wide mb-2 text-base">
                  About
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {selectedCinema.description}
                </p>
              </div>
            )}

            {/* Contact */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-800/90 p-5 flex flex-col gap-3 text-xs text-slate-300">
              {selectedCinema.socials?.website && (
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-red-500 shrink-0" />
                  <a
                    href={selectedCinema.socials.website}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline text-red-400 truncate"
                  >
                    {selectedCinema.socials.website}
                  </a>
                </div>
              )}
            </div>

            {/* Gallery Grid */}
            {galleryImages.length > 0 && (
              <div>
                <h3 className="font-display font-bold text-white uppercase tracking-wide mb-3 text-base">
                  Gallery
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {galleryImages.map((src, i) => (
                    <div
                      key={i}
                      className="rounded-lg overflow-hidden aspect-video bg-slate-900 border border-slate-800/60"
                    >
                      <img
                        src={src}
                        alt=""
                        className="w-full h-full object-cover opacity-75 hover:opacity-100 transition-opacity"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Daily Schedule Column */}
          <div id="daily-schedule" className="lg:col-span-2">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white uppercase tracking-wide mb-5">
              Daily Schedule
            </h2>

            <div className="relative mb-6 -mx-4 sm:mx-0">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none px-4 sm:px-0">
                {dates.map((d, i) => (
                  <button
                    type="button"
                    key={i}
                    onClick={() => setActiveDay(i)}
                    className={`shrink-0 min-w-[85px] sm:min-w-[100px] px-3.5 py-2.5 rounded-xl border text-sm transition-all text-center ${
                      activeDay === i
                        ? "bg-red-600 border-red-600 text-white font-bold shadow-md shadow-red-600/20"
                        : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <div className="font-bold text-xs sm:text-sm">
                      {i === 0
                        ? "Today"
                        : i === 1
                          ? "Tomorrow"
                          : format(d, "EEE")}
                    </div>
                    <div className="text-[10px] sm:text-[11px] opacity-80 mt-0.5">
                      {format(d, "MMM d")}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {scheduleLoading ? (
                <div className="flex items-center gap-3 text-slate-400 text-sm py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                  Loading schedule...
                </div>
              ) : scheduleError ? (
                <p className="text-sm text-red-500 py-10">{scheduleError}</p>
              ) : movieGroups.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-10 text-center">
                  <Film className="w-10 h-10 mx-auto mb-3 text-slate-600 opacity-60" />
                  <p className="text-slate-300 text-sm font-semibold mb-1">
                    No screenings this day
                  </p>
                  <p className="text-slate-500 text-xs">
                    Try another date to see available showtimes.
                  </p>
                </div>
              ) : (
                movieGroups.map((group) => {
                  const movie = getMovie(group[0]);
                  const sorted = [...group].sort(
                    (a, b) =>
                      new Date(a.startTime).getTime() -
                      new Date(b.startTime).getTime(),
                  );
                  return (
                    <div
                      key={String(movie?._id ?? group[0].movieId)}
                      className="bg-slate-900/80 rounded-xl border border-slate-800/90 p-4 flex gap-4 hover:border-slate-700 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => navigate(`/movies/${group[0].movieId}`)}
                        className="shrink-0"
                      >
                        <img
                          src={
                            movie?.posterUrl ||
                            "https://via.placeholder.com/100x150?text=No+Poster"
                          }
                          alt={movie?.title || "Movie"}
                          className="w-16 h-24 object-cover rounded-lg shrink-0 bg-slate-950 border border-slate-800/80"
                        />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-display font-bold text-white text-base sm:text-lg uppercase tracking-wide leading-tight truncate">
                            {movie?.title || "Unknown movie"}
                          </h4>
                          <span className="bg-slate-800 text-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-700 shrink-0">
                            {movie?.contentRating || "NR"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-400 text-xs mb-3">
                          <span>{formatRuntime(movie?.durationMinutes)}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          <span>{group[0].roomName}</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {sorted.map((st) => (
                            <button
                              type="button"
                              key={String(st._id)}
                              onClick={() => navigate(`/book/${st._id}`)}
                              className="text-xs border border-slate-800 bg-slate-950/60 hover:border-red-600/60 hover:text-white text-slate-300 px-3 py-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-1.5"
                            >
                              <Clock className="w-3 h-3 text-red-500" />
                              <span className="font-bold text-white">
                                {format(new Date(st.startTime), "h:mm a")}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                {formatCurrency(st.seats[0]?.price ?? 0, cinemaCurrency)}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
