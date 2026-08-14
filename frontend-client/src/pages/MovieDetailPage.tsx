import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  Play,
  Clock,
  Calendar,
  Ticket,
  ArrowLeft,
  Loader2,
  Film,
  Building2,
} from "lucide-react";
import { addDays, format } from "date-fns";
import SectionLabel from "../components/SectionLabel";
import { useMovieStore } from "../stores/movie.store";
import { useScreeningStore } from "../stores/screening.store";
import { type IScreening } from "../types/booking.type";
import { type IMovie } from "../types/movie.type";

export interface DetailedMovie {
  id: string;
  title: string;
  tagline: string;
  poster: string;
  backdrop: string;
  rating: string;
  runtime: string;
  releaseDate: string;
  synopsis: string;
  director: string;
  language: string;
  cast: string[];
  genres: string[];
  comingSoon?: boolean;
}

export interface Cinema {
  id: string;
  name: string;
}

// Maps backend IMovie data to frontend DetailedMovie shape
const mapMovieToDetailed = (movie: IMovie): DetailedMovie => {
  const isUpcoming = movie.status === "UPCOMING";
  const releaseDateObj = movie.releaseDate ? new Date(movie.releaseDate) : null;
  const formattedDate = releaseDateObj
    ? releaseDateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "TBA";

  return {
    id: String(movie._id || ""),
    title: movie.title,
    tagline: movie.tagline || "",
    poster: movie.posterUrl,
    backdrop: movie.backdropUrl,
    rating: movie.contentRating,
    runtime: `${movie.durationMinutes}m`,
    releaseDate: formattedDate,
    synopsis: movie.synopsis,
    director: movie.director,
    language: movie.originalLanguage,
    cast: movie.castMembers || [],
    genres: movie.genres || [],
    comingSoon: isUpcoming,
  };
};

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Zustand Movie Store
  const {
    selectedMovie,
    isLoading,
    error,
    getMovieByIdAction,
    clearSelectedMovie,
  } = useMovieStore();

  const {
    screenings,
    isLoading: isScreeningsLoading,
    getPublicScreeningsAction,
  } = useScreeningStore();

  const [selectedDay, setSelectedDay] = useState("");

  useEffect(() => {
    if (id) {
      getMovieByIdAction(id);
      getPublicScreeningsAction({ movieId: id, limit: 50 });
    }

    return () => {
      clearSelectedMovie();
    };
  }, [id, getMovieByIdAction, getPublicScreeningsAction, clearSelectedMovie]);

  // All future screenings of this movie, grouped by calendar day so every
  // available screening is shown regardless of how far ahead it is.
  const screeningsByDay = useMemo(() => {
    const map = new Map<string, IScreening[]>();
    for (const s of screenings) {
      const day = format(new Date(s.startTime), "yyyy-MM-dd");
      const list = map.get(day) ?? [];
      list.push(s);
      map.set(day, list);
    }
    return map;
  }, [screenings]);

  const days = useMemo(
    () => Array.from(screeningsByDay.keys()).sort(),
    [screeningsByDay],
  );

  const visibleDays = selectedDay ? [selectedDay] : days;

  // Groups a day's screenings by cinema, sorted by start time.
  const groupsForDay = (day: string) => {
    const list = screeningsByDay.get(day) ?? [];
    const map = new Map<string, { cinema: Cinema; screenings: IScreening[] }>();
    for (const screening of list) {
      const cinema =
        typeof screening.cinemaId === "object" && screening.cinemaId
          ? { id: String(screening.cinemaId._id), name: screening.cinemaId.name }
          : { id: String(screening.cinemaId), name: "Cinema" };
      const group = map.get(cinema.id) ?? {
        cinema,
        screenings: [] as IScreening[],
      };
      group.screenings.push(screening);
      map.set(cinema.id, group);
    }
    for (const group of map.values()) {
      group.screenings.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );
    }
    return Array.from(map.values());
  };

  const dayLabel = (day: string) => {
    const today = format(new Date(), "yyyy-MM-dd");
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
    if (day === today) return "Today";
    if (day === tomorrow) return "Tomorrow";
    return format(new Date(`${day}T00:00:00`), "EEE");
  };

  if (isLoading) {
    return (
      <div className="bg-slate-950 min-h-screen text-white flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
        <p className="text-slate-400 text-sm font-medium">
          Loading movie details...
        </p>
      </div>
    );
  }

  if (error || !selectedMovie) {
    return (
      <div className="bg-slate-950 min-h-screen text-white flex flex-col items-center justify-center px-6 py-24">
        <div className="text-center max-w-md bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
          <Film className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-60" />
          <h3 className="font-display font-bold text-lg text-white mb-2 uppercase tracking-wide">
            Movie Not Found
          </h3>
          <p className="text-slate-400 text-sm mb-6">
            {error ||
              "The movie details you are looking for could not be retrieved."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/movies")}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg transition-all"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  const movie = mapMovieToDetailed(selectedMovie);

  const handleBookTickets = (showtimeId?: string | number) => {
    const stId = showtimeId ?? screenings[0]?._id;
    if (!stId) return;
    navigate(`/book/${stId}`);
  };

  return (
    <div className="bg-slate-950 min-h-screen text-white selection:bg-red-600 selection:text-white">
      {/* Backdrop Hero */}
      <div className="relative h-[45vh] sm:h-[55vh] min-h-[320px] max-h-[600px] overflow-hidden bg-slate-900">
        <img
          src={movie.backdrop}
          alt={movie.title}
          className="w-full h-full object-cover opacity-35 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 to-transparent" />

        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate("/movies")}
          className="absolute top-16 sm:top-24 left-4 sm:left-6 flex items-center gap-2 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors z-20 drop-shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Movies
        </button>

        {/* Trailer Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/25 transition-all group active:scale-95 shadow-2xl"
          >
            <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white ml-1 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Main Detail Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-24 sm:-mt-44 relative z-10 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 sm:gap-8 lg:gap-12 items-start">
          {/* Elongated Poster Container */}
          <div className="shrink-0 mx-auto md:mx-0">
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-40 sm:w-56 md:w-64 lg:w-72 aspect-[2/3] object-cover h-60 sm:h-80 md:h-96 lg:h-[420px] rounded-xl shadow-2xl shadow-black/90 border border-slate-800/80"
            />
          </div>

          {/* Info Column */}
          <div className="pt-0 md:pt-28 text-center md:text-left">
            {/* Genres */}
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
              {movie.genres.map((g) => (
                <span
                  key={g}
                  className="text-xs text-slate-300 bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-800"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-white uppercase tracking-tight leading-none mb-2 sm:mb-3">
              {movie.title}
            </h1>

            {/* Tagline */}
            {movie.tagline && (
              <p className="text-slate-400 italic text-sm sm:text-lg mb-4">
                &ldquo;{movie.tagline}&rdquo;
              </p>
            )}

            {/* Meta Row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-5 mb-5">
              <span className="bg-slate-800 text-slate-200 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-700">
                {movie.rating}
              </span>

              <span className="text-slate-400 text-xs sm:text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" /> {movie.runtime}
              </span>

              <span className="text-slate-400 text-xs sm:text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />{" "}
                {movie.releaseDate}
              </span>
            </div>

            {/* Synopsis */}
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mb-6 mx-auto md:mx-0">
              {movie.synopsis}
            </p>

            {/* Clean Director, Language & Cast Layout */}
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 sm:gap-x-8 mb-8 max-w-lg text-left mx-auto md:mx-0">
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">
                  Director
                </p>
                <p className="text-white text-sm font-semibold">
                  {movie.director}
                </p>
              </div>

              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">
                  Language
                </p>
                <p className="text-white text-sm font-semibold">
                  {movie.language}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">
                  Cast
                </p>
                <p className="text-slate-300 text-sm">
                  {movie.cast.length > 0 ? movie.cast.join(", ") : "N/A"}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-center md:justify-start gap-3">
              {!movie.comingSoon && (
                <button
                  type="button"
                  onClick={() => handleBookTickets()}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-all shadow-lg shadow-red-600/25"
                >
                  <Ticket className="w-4 h-4" /> Book Tickets
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Showtimes & Booking Section */}
        {!movie.comingSoon && (
          <div className="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-slate-800/80">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <SectionLabel>Select Your Show</SectionLabel>
                <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white uppercase tracking-wide">
                  Showtimes
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 font-medium sm:hidden pb-1 whitespace-nowrap">
                Swipe &rarr;
              </span>
              <Link
                to="/screenings"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-red-400 hover:text-red-300 border border-red-600/40 bg-red-950/20 hover:bg-red-950/40 px-3.5 py-2 rounded-lg transition-all shrink-0"
              >
                View all screenings
              </Link>
            </div>

            {/* Day Filter Chips with Fade Gradients */}
            {!isScreeningsLoading && days.length > 0 && (
              <div className="relative mb-6 -mx-4 sm:mx-0">
                {/* Fade Overlays */}
                <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none sm:hidden" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none sm:hidden" />

                {/* Scroll Container */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none px-4 sm:px-0">
                  <button
                    type="button"
                    onClick={() => setSelectedDay("")}
                    className={`shrink-0 min-w-[85px] sm:min-w-[100px] px-3.5 py-2.5 rounded-xl border text-sm transition-all text-center ${
                      selectedDay === ""
                        ? "bg-red-600 border-red-600 text-white font-bold shadow-md shadow-red-600/20"
                        : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <div className="font-bold text-xs sm:text-sm">All Days</div>
                    <div className="text-[10px] sm:text-[11px] opacity-80 mt-0.5">
                      {days.length} day{days.length > 1 ? "s" : ""}
                    </div>
                  </button>
                  {days.map((day) => (
                    <button
                      type="button"
                      key={day}
                      onClick={() =>
                        setSelectedDay(selectedDay === day ? "" : day)
                      }
                      className={`shrink-0 min-w-[85px] sm:min-w-[100px] px-3.5 py-2.5 rounded-xl border text-sm transition-all text-center ${
                        selectedDay === day
                          ? "bg-red-600 border-red-600 text-white font-bold shadow-md shadow-red-600/20"
                          : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
                      }`}
                    >
                      <div className="font-bold text-xs sm:text-sm">
                        {dayLabel(day)}
                      </div>
                      <div className="text-[10px] sm:text-[11px] opacity-80 mt-0.5">
                        {format(new Date(`${day}T00:00:00`), "MMM d")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Screening List Grouped by Day, Then Cinema */}
            {isScreeningsLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin text-red-600 mr-3" />
                <span className="text-sm">Loading screenings...</span>
              </div>
            ) : screenings.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
                <Film className="w-10 h-10 mx-auto mb-3 text-slate-600 opacity-60" />
                <p className="text-slate-400 text-sm">
                  No screenings scheduled for this movie yet. Check back soon.
                </p>
              </div>
            ) : (
              <div className="space-y-10">
                {visibleDays.map((day) => {
                  const groups = groupsForDay(day);
                  if (groups.length === 0) return null;
                  return (
                    <section key={day}>
                      <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <h3 className="font-display font-bold text-lg sm:text-xl text-white uppercase tracking-wide">
                          {dayLabel(day)}
                        </h3>
                        <span className="text-xs sm:text-sm text-slate-500">
                          {format(new Date(`${day}T00:00:00`), "EEEE, MMMM d")}
                        </span>
                      </div>

                      <div className="space-y-6">
                        {groups.map((group) => (
                          <div key={group.cinema.id}>
                            <div className="flex items-center gap-2 mb-3">
                              <Building2 className="w-4 h-4 text-slate-500" />
                              <h4 className="text-sm sm:text-base font-bold text-white">
                                {group.cinema.name}
                              </h4>
                              <span className="text-[11px] text-slate-500">
                                {group.screenings.length} screening
                                {group.screenings.length > 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                              {group.screenings.map((s) => (
                                <button
                                  type="button"
                                  key={String(s._id)}
                                  onClick={() => handleBookTickets(String(s._id))}
                                  className="group border rounded-xl p-3.5 sm:p-4 text-left transition-all hover:-translate-y-0.5 active:scale-95 border-slate-800/90 bg-slate-900/80 hover:border-slate-700"
                                >
                                  <div className="font-display font-bold text-base sm:text-lg text-white group-hover:text-red-400 transition-colors">
                                    {format(new Date(s.startTime), "h:mm a")}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-slate-400">
                                    <span className="font-medium text-slate-300">
                                      Standard 2D
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                    <span>{s.roomName}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                                    <span className="font-bold text-slate-200">
                                      ${s.seats[0]?.price ?? 0}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
