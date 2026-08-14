import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Clock,
  Ticket,
  Play,
  ChevronRight,
  MapPin,
  Loader2,
  Film,
} from "lucide-react";
import MovieCard from "../components/movies/MovieCard";
import SectionLabel from "../components/SectionLabel";
import { useMovieStore } from "../stores/movie.store";
import { useCinemaStore } from "../stores/cinema.store";
import { type IMovie } from "../types/movie.type";
import { type ICinema } from "../types/cinema.type";

// Fallback artwork for cinemas without uploaded images.
const FALLBACK_CINEMA_IMAGE =
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800";

const mapCinemaToCard = (cinema: ICinema) => {
  const city = [cinema.address.city, cinema.address.country]
    .filter(Boolean)
    .join(", ");
  return {
    id: String(cinema._id || ""),
    name: cinema.name,
    image: cinema.images?.[0] || FALLBACK_CINEMA_IMAGE,
    address: [cinema.address.street, city].filter(Boolean).join(", "),
    screens: cinema.rooms?.length ?? 0,
    city,
  };
};

interface FeaturedMovie {
  id: string;
  title: string;
  tagline: string;
  poster: string;
  backdrop: string;
  rating: string;
  runtime: string;
  genres: string[];
  formats: string[];
  comingSoon: boolean;
}

const mapMovieToCardFormat = (m: IMovie) => {
  return {
    id: String(m._id || ""),
    title: m.title,
    poster: m.posterUrl,
    rating: m.contentRating,
    runtime: `${m.durationMinutes}m`,
    genres: m.genres || [],
    comingSoon: m.status === "UPCOMING",
    releaseLabel:
      m.status === "UPCOMING" && m.releaseDate
        ? `Releasing ${new Date(m.releaseDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`
        : undefined,
  };
};

// Helper to transform store/backend IMovie to Featured Movie shape
const mapMovieToFeatured = (m: IMovie): FeaturedMovie => {
  return {
    id: String(m._id || ""),
    title: m.title,
    tagline: m.tagline || "",
    poster: m.posterUrl,
    backdrop: m.backdropUrl,
    rating: m.contentRating,
    runtime: `${m.durationMinutes}m`,
    genres: m.genres || [],
    formats: ["IMAX 3D", "Dolby Atmos"],
    comingSoon: m.status === "UPCOMING",
  };
};

export default function HomePage() {
  const navigate = useNavigate();

  // Zustand Movie Store
  const { movies, isLoading, error, getAllMoviesAction } = useMovieStore();
  const {
    cinemas,
    isLoading: cinemasLoading,
    error: cinemasError,
    getAllCinemasAction,
  } = useCinemaStore();

  const [activeGenre, setActiveGenre] = useState("All");
  const [cityQuery, setCityQuery] = useState("");
  const [submittedCity, setSubmittedCity] = useState("");

  useEffect(() => {
    getAllMoviesAction();
  }, [getAllMoviesAction]);

  const handleCinemaSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedCity(cityQuery.trim());
  };

  useEffect(() => {
    getAllCinemasAction(submittedCity ? { city: submittedCity } : undefined);
  }, [submittedCity, getAllCinemasAction]);

  const cinemaCards = cinemas.map(mapCinemaToCard);

  const genres = [
    "All",
    "Action",
    "Sci-Fi",
    "Drama",
    "Comedy",
    "Horror",
    "Animation",
  ];

  // Derive movie sections from store state
  const rawNowShowing = movies.filter((m) => m.status === "NOW_SHOWING");
  const rawComingSoon = movies.filter((m) => m.status === "UPCOMING");

  const featuredRaw = rawNowShowing[0] || movies[0];
  const featured = featuredRaw ? mapMovieToFeatured(featuredRaw) : null;

  const nowShowingCardMovies = rawNowShowing.map(mapMovieToCardFormat);
  const comingSoonCardMovies = rawComingSoon.map(mapMovieToCardFormat);

  const filteredMovies =
    activeGenre === "All"
      ? nowShowingCardMovies
      : nowShowingCardMovies.filter((m) => m.genres.includes(activeGenre));

  return (
    <div className="bg-slate-950 min-h-screen text-white selection:bg-red-600 selection:text-white">
      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center pt-32 pb-12">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
          <p className="text-slate-400 text-sm font-medium">
            Fetching catalog...
          </p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-8">
          <div className="bg-red-950/20 border border-red-800/50 rounded-xl p-4 text-center text-red-400 text-sm">
            Failed to load movies: {error}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && movies.length === 0 && (
        <div className="flex flex-col items-center justify-center pt-32 pb-24 text-center px-6">
          <Film className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="font-display font-bold text-lg text-white mb-1 uppercase tracking-wide">
            No Movies Available
          </h3>
          <p className="text-slate-400 text-sm">
            Check back later for new screenings and showtimes.
          </p>
        </div>
      )}

      {/* Hero Section */}
      {!isLoading && featured && (
        <section className="relative h-[88vh] min-h-[640px] max-h-[780px] flex items-end pb-16 md:pb-20 pt-20 overflow-hidden">
          {/* Background Backdrop Image */}
          <div className="absolute inset-0 bg-slate-900">
            <img
              src={featured.backdrop}
              alt={featured.title}
              className="w-full h-full object-cover opacity-35 scale-105 transition-transform duration-1000"
            />
          </div>

          {/* Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-slate-950/40" />

          {/* Hero Content Grid */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-7 lg:col-span-7">
              <SectionLabel>Featured Tonight</SectionLabel>
              <h1 className="font-black font-display text-5xl sm:text-6xl lg:text-7xl text-white uppercase leading-none tracking-tight mt-1 mb-3">
                {featured.title}
              </h1>
              {featured.tagline && (
                <p className="text-slate-300 font-medium italic text-base sm:text-lg mb-5 max-w-xl">
                  &ldquo;{featured.tagline}&rdquo;
                </p>
              )}

              {/* Meta badges */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-5">
                <span className="bg-slate-800/80 text-slate-200 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-700">
                  {featured.rating}
                </span>
                <span className="text-slate-400 text-xs sm:text-sm flex items-center gap-1.5 bg-slate-900/40 px-2.5 py-1 rounded-md border border-slate-800/80">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />{" "}
                  {featured.runtime}
                </span>
              </div>

              {/* Genres & Formats */}
              <div className="flex flex-wrap gap-2 mb-6">
                {featured.genres.map((g) => (
                  <span
                    key={g}
                    className="text-xs text-slate-300 bg-slate-900/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-800"
                  >
                    {g}
                  </span>
                ))}
                {featured.formats.map((f) => (
                  <span
                    key={f}
                    className="text-xs font-bold text-red-500 bg-red-950/20 border border-red-600/40 px-3 py-1 rounded-full"
                  >
                    {f}
                  </span>
                ))}
              </div>

              {/* Hero Action Buttons */}
              <div className="flex flex-wrap gap-3.5">
                <Link
                  to={`/screenings?movieId=${featured.id}`}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-all shadow-lg shadow-red-600/25"
                >
                  <Ticket className="w-4 h-4" /> Book Tickets
                </Link>
                <button
                  type="button"
                  onClick={() => navigate(`/movies/${featured.id}`)}
                  className="flex items-center gap-2 border border-slate-700/80 hover:border-slate-500 text-slate-200 hover:text-white font-semibold text-sm px-5 py-3 rounded-lg transition-all bg-slate-900/60 backdrop-blur-md hover:bg-slate-800/80 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" /> Details & Trailer
                </button>
              </div>
            </div>

            {/* Hero Side Poster */}
            <div className="hidden md:flex md:col-span-5 lg:col-span-5 justify-end items-end">
              <Link
                to={`/movies/${featured.id}`}
                className="relative group cursor-pointer"
              >
                <div className="relative w-[260px] h-[385px] rounded-xl overflow-hidden shadow-2xl shadow-black/95 border border-slate-800 transition-all duration-500 group-hover:scale-105 group-hover:border-slate-700 transform rotate-2">
                  <img
                    src={featured.poster}
                    alt={featured.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity" />
                </div>

                <div className="absolute -top-2 -left-3 bg-red-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded uppercase tracking-wider shadow-lg border border-red-500/50">
                  {featured.comingSoon ? "Coming Soon" : "Now Showing"}
                </div>
              </Link>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-500 opacity-80">
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Scroll
            </span>
            <div className="w-px h-4 bg-gradient-to-b from-slate-500 to-transparent" />
          </div>
        </section>
      )}

      {/* Now Showing Section */}
      {!isLoading && movies.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-12 sm:py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <SectionLabel>On Screen Now</SectionLabel>
              <h2 className="font-extrabold text-3xl md:text-4xl text-white uppercase tracking-wide">
                Now Showing
              </h2>
            </div>
            <Link
              to="/movies"
              className="hidden md:flex items-center gap-1 text-slate-400 hover:text-white text-sm font-medium transition-colors group"
            >
              <span>View All Movies</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Genre Filter Tabs */}
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
            {genres.map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setActiveGenre(g)}
                className={`shrink-0 text-xs sm:text-sm font-semibold px-4 py-2 rounded-full border transition-all ${
                  activeGenre === g
                    ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-600/20"
                    : "border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white bg-slate-900/60"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Movie Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {filteredMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>
      )}

      {/* Coming Soon Section */}
      {!isLoading && comingSoonCardMovies.length > 0 && (
        <section className="bg-slate-900/50 border-y border-slate-800/80 py-12 sm:py-16 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <SectionLabel>Coming Soon</SectionLabel>
                <h2 className="font-extrabold text-3xl md:text-4xl text-white uppercase tracking-wide">
                  On the Horizon
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
              {comingSoonCardMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nearby Cinemas Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 sm:py-16">
        <div className="mb-8">
          <SectionLabel>Find a Cinema</SectionLabel>
          <h2 className="font-extrabold text-3xl md:text-4xl text-white uppercase tracking-wide">
            Nearby Cinemas
          </h2>
        </div>

        {/* Location Search Bar */}
        <form onSubmit={handleCinemaSearch} className="flex gap-3 mb-10 max-w-md">
          <div className="relative flex-1">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="Search by city or area..."
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

        {cinemasError && (
          <p className="mb-6 text-sm text-red-500">{cinemasError}</p>
        )}

        {/* Cinema Cards */}
        {cinemasLoading ? (
          <div className="flex items-center gap-3 text-slate-400 text-sm py-12">
            <Loader2 className="w-5 h-5 animate-spin text-red-600" />
            Loading cinemas...
          </div>
        ) : cinemaCards.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-10 text-center">
            <Film className="w-10 h-10 mx-auto mb-3 text-slate-600 opacity-60" />
            <p className="text-slate-300 text-sm font-semibold mb-1">
              No cinemas found
            </p>
            <p className="text-slate-500 text-xs">
              {submittedCity
                ? `No active cinemas match "${submittedCity}".`
                : "There are no active cinemas to show right now."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cinemaCards.map((cinema) => (
              <div
                key={cinema.id}
                onClick={() => navigate(`/cinemas/${cinema.id}`)}
                className="group bg-slate-900/90 rounded-xl overflow-hidden border border-slate-800/80 hover:border-slate-700 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/60"
              >
                <div className="h-44 overflow-hidden relative bg-slate-800">
                  <img
                    src={cinema.image}
                    alt={cinema.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-85"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-white text-lg uppercase tracking-wide mb-1">
                    {cinema.name}
                  </h3>
                  <div className="flex items-start gap-1.5 text-slate-400 text-xs mb-4">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-500" />
                    <span className="leading-relaxed">{cinema.address}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-red-500">{cinema.city}</span>
                    <span className="text-slate-500">
                      {cinema.screens} screen{cinema.screens !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
