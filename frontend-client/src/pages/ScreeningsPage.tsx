import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Search, Ticket, MapPin, Clock, Loader2, Film } from "lucide-react";
import { format } from "date-fns";
import SectionLabel from "../components/SectionLabel";
import { useScreeningStore } from "../stores/screening.store";
import type { IScreening } from "../types/booking.type";
import { formatCurrency } from "../utils/currency";

const PAGE_SIZE = 12;

const getMovie = (s: IScreening) =>
  typeof s.movieId === "object" && s.movieId ? s.movieId : null;
const getCinema = (s: IScreening) =>
  typeof s.cinemaId === "object" && s.cinemaId ? s.cinemaId : null;

const ScreeningCard = ({ screening }: { screening: IScreening }) => {
  const navigate = useNavigate();
  const movie = getMovie(screening);
  const cinema = getCinema(screening);
  const available = screening.seats.filter(
    (seat) => seat.status === "available",
  ).length;
  const minPrice = screening.seats.reduce(
    (min, seat) => (seat.price < min ? seat.price : min),
    screening.seats[0]?.price ?? 0,
  );

  return (
    <div className="flex gap-4 bg-slate-900/80 rounded-xl border border-slate-800/90 p-4 hover:border-slate-700 transition-all hover:-translate-y-0.5">
      <button
        type="button"
        onClick={() => navigate(`/movies/${screening.movieId}`)}
        className="shrink-0"
      >
        <img
          src={movie?.posterUrl || "https://via.placeholder.com/100x150?text=No+Poster"}
          alt={movie?.title || "Movie"}
          className="w-16 h-24 object-cover rounded-lg shrink-0 bg-slate-950 border border-slate-800/80"
        />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <h4 className="font-display font-bold text-white text-base sm:text-lg uppercase tracking-wide leading-tight truncate">
              {movie?.title || "Unknown movie"}
            </h4>
            {cinema && (
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="truncate">{cinema.name}</span>
              </div>
            )}
          </div>
          <span className="bg-slate-800 text-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-700 shrink-0">
            {movie?.contentRating || "NR"}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1.5">
          <span className="flex items-center gap-1 font-semibold text-white">
            <Clock className="w-3.5 h-3.5 text-red-500" />
            {format(new Date(screening.startTime), "EEE, MMM d")}
          </span>
          <span className="font-bold text-white">
            {format(new Date(screening.startTime), "h:mm a")}
          </span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>{screening.roomName}</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>{available} seat{available !== 1 ? "s" : ""} left</span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/70">
          <span className="text-sm text-slate-300">
            From{" "}
            <span className="font-bold text-white">{formatCurrency(minPrice, cinema?.currency)}</span>
          </span>
          <button
            type="button"
            onClick={() => navigate(`/book/${screening._id}`)}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-md shadow-red-600/20"
          >
            <Ticket className="w-3.5 h-3.5" /> Select Seats
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ScreeningsPage() {
  const {
    screenings,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    getPublicScreeningsAction,
  } = useScreeningStore();

  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const pageRef = useRef(1);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fetchPage = useCallback(
    async (pageNum: number, term: string, append: boolean) => {
      await getPublicScreeningsAction(
        {
          q: term || undefined,
          page: pageNum,
          limit: PAGE_SIZE,
        },
        append,
      );
    },
    [getPublicScreeningsAction],
  );

  useEffect(() => {
    pageRef.current = 1;
    fetchPage(1, submittedQuery, false);
  }, [submittedQuery, fetchPage]);

  // Infinite scroll: load the next page when the sentinel becomes visible.
  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) return;
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        const next = pageRef.current + 1;
        pageRef.current = next;
        void fetchPage(next, submittedQuery, true);
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, submittedQuery, fetchPage]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(query.trim());
  };

  return (
    <div className="bg-slate-950 min-h-screen text-white pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <SectionLabel>Find a Show</SectionLabel>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-white uppercase tracking-tight mb-3">
            Screenings
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl">
            Upcoming screenings of the latest releases. Search by movie title or
            cinema name.
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by movie or cinema..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600/60 transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-md shadow-red-600/20 active:scale-95"
          >
            Search
          </button>
        </form>

        {error && <p className="mb-6 text-sm text-red-500">{error}</p>}

        {isLoading ? (
          <div className="flex items-center gap-3 text-slate-400 text-sm py-16">
            <Loader2 className="w-5 h-5 animate-spin text-red-600" />
            Loading screenings...
          </div>
        ) : screenings.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-10 text-center">
            <Film className="w-10 h-10 mx-auto mb-3 text-slate-600 opacity-60" />
            <p className="text-slate-300 text-sm font-semibold mb-1">
              No screenings found
            </p>
            <p className="text-slate-500 text-xs">
              {submittedQuery
                ? `Nothing matches "${submittedQuery}". Try another search.`
                : "There are no upcoming screenings right now."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {screenings.map((s) => (
                <ScreeningCard key={s._id} screening={s} />
              ))}
            </div>

            {hasMore && (
              <div ref={loadMoreRef} className="mt-10 flex justify-center">
                {isLoadingMore ? (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                    Loading more...
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const next = pageRef.current + 1;
                      pageRef.current = next;
                      void fetchPage(next, submittedQuery, true);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold px-6 py-3 rounded-lg transition-colors"
                  >
                    Load More Screenings
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
