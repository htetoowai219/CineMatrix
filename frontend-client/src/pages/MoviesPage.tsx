import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, Filter, Film, X, Loader2 } from "lucide-react";
import MovieCard, { type Movie } from "../components/movies/MovieCard";
import SectionLabel from "../components/SectionLabel";
import { useMovieStore } from "../stores/movie.store";
import { type IMovie } from "../types/movie.type";

export interface FilterableMovie extends Movie {
  language?: string;
  formats: string[];
}

// Maps backend IMovie data to frontend FilterableMovie shape
const mapMovieToFilterable = (movie: IMovie): FilterableMovie => {
  const isUpcoming = movie.status === "UPCOMING";
  const releaseDateObj = movie.releaseDate ? new Date(movie.releaseDate) : null;
  const formattedDate = releaseDateObj
    ? releaseDateObj.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "";

  return {
    id: String(movie._id || ""),
    title: movie.title,
    poster: movie.posterUrl,
    rating: movie.contentRating,
    score: movie.averageScore ?? 0,
    runtime: `${movie.durationMinutes}m`,
    genres: movie.genres || [],
    language: movie.originalLanguage,
    formats: ["2D"], // Default format array if omitted in database model
    comingSoon: isUpcoming,
    releaseLabel:
      isUpcoming && formattedDate ? `Releasing ${formattedDate}` : undefined,
  };
};

export default function MoviesPage() {
  const navigate = useNavigate();

  // Zustand Movie Store
  const { movies, isLoading, error, getAllMoviesAction } = useMovieStore();

  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const [lang, setLang] = useState("All");
  const [fmt, setFmt] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    getAllMoviesAction();
  }, [getAllMoviesAction]);

  const allGenres = [
    "All",
    "Action",
    "Sci-Fi",
    "Drama",
    "Comedy",
    "Horror",
    "Animation",
    "Thriller",
    "Adventure",
    "Superhero",
  ];
  const langs = ["All", "English", "Spanish", "Hindi", "French", "Japanese"];
  const fmts = ["All", "2D", "3D", "IMAX"];

  const mappedMovies = movies.map(mapMovieToFilterable);

  const isFiltering =
    search !== "" || genre !== "All" || lang !== "All" || fmt !== "All";

  const matchesFilters = (m: FilterableMovie) => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genre === "All" || m.genres.includes(genre);
    const matchLang = lang === "All" || m.language === lang;
    const matchFmt = fmt === "All" || m.formats.includes(fmt);
    return matchSearch && matchGenre && matchLang && matchFmt;
  };

  const nowShowing = mappedMovies.filter(
    (m) => !m.comingSoon && matchesFilters(m),
  );
  const comingSoon = mappedMovies.filter(
    (m) => m.comingSoon && matchesFilters(m),
  );
  const totalFiltered = nowShowing.length + comingSoon.length;

  const resetFilters = () => {
    setSearch("");
    setGenre("All");
    setLang("All");
    setFmt("All");
  };

  return (
    <div className="bg-slate-950 min-h-screen text-white pt-24 pb-20 selection:bg-red-600 selection:text-white">
      {/* Header & Filter Controls Container */}
      <div className="max-w-7xl mx-auto px-6 mb-8">
        {/* Header */}
        <div className="mb-8">
          <SectionLabel>Browse Catalog</SectionLabel>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-white uppercase tracking-wide">
            All Movies
          </h1>
        </div>

        {/* Search & Filter Trigger Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search movies by title..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600/60 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 border rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                showFilters
                  ? "bg-red-600 border-red-600 text-white shadow-md shadow-red-600/20"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              <Filter className="w-4 h-4" /> Filters
            </button>

            {isFiltering && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-slate-400 hover:text-red-500 underline px-2 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-6 backdrop-blur-sm">
            {[
              {
                label: "Genre",
                options: allGenres,
                value: genre,
                set: setGenre,
              },
              { label: "Language", options: langs, value: lang, set: setLang },
              { label: "Format", options: fmts, value: fmt, set: setFmt },
            ].map(({ label, options, value, set }) => (
              <div key={label}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  {label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {options.map((o) => (
                    <button
                      type="button"
                      key={o}
                      onClick={() => set(o)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        value === o
                          ? "bg-red-600 border-red-600 text-white font-bold shadow-sm"
                          : "border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-white"
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Counter when filtering */}
        {isFiltering && !isLoading && (
          <p className="text-slate-500 text-xs sm:text-sm font-medium mb-4">
            Showing{" "}
            <span className="text-white font-bold">{totalFiltered}</span> result
            {totalFiltered !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-red-600 mb-4" />
          <p className="text-slate-400 text-sm font-medium">
            Fetching movies from server...
          </p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center py-16 bg-red-950/20 border border-red-900/50 rounded-2xl">
            <p className="text-red-400 font-semibold mb-4">{error}</p>
            <button
              type="button"
              onClick={() => getAllMoviesAction()}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Empty State (Filtered or No Movies Available) */}
      {!isLoading &&
        !error &&
        (mappedMovies.length === 0 || (isFiltering && totalFiltered === 0)) && (
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center py-24 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
              <Film className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-60" />
              <h3 className="font-display font-bold text-lg text-white mb-1 uppercase tracking-wide">
                No movies found
              </h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                We couldn't find any titles matching your selected filters or
                search terms.
              </p>
              {isFiltering && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-700 transition-all"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        )}

      {/* Content Rendering */}
      {!isLoading && !error && (
        <>
          {/* Now Showing Section */}
          {nowShowing.length > 0 && (
            <section className="max-w-7xl mx-auto px-6 mb-16">
              <div className="flex items-end justify-between mb-6">
                <div>
                  <SectionLabel>On Screen Now</SectionLabel>
                  <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white uppercase tracking-wide">
                    Now Showing
                  </h2>
                </div>
                <span className="text-slate-500 text-xs sm:text-sm font-medium">
                  {nowShowing.length} film{nowShowing.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
                {nowShowing.map((m) => (
                  <MovieCard key={m.id} movie={m} />
                ))}
              </div>
            </section>
          )}

          {/* Coming Soon Section */}
          {comingSoon.length > 0 && (
            <section className="bg-slate-900/40 border-y border-slate-800/80 py-16">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <SectionLabel>Coming Soon</SectionLabel>
                    <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-white uppercase tracking-wide">
                      On the Horizon
                    </h2>
                  </div>
                  <span className="text-slate-500 text-xs sm:text-sm font-medium">
                    {comingSoon.length} film{comingSoon.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
                  {comingSoon.map((m) => (
                    <MovieCard key={m.id} movie={m} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
