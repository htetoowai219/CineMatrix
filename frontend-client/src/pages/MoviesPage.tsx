import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Filter, Film, X } from "lucide-react";
import MovieCard, { type Movie } from "../components/movies/MovieCard";
import SectionLabel from "../components/SectionLabel";

// Extended interface matching the filter options
export interface FilterableMovie extends Movie {
  language?: string;
  formats: string[];
}

// Sample Data
const MOVIES: FilterableMovie[] = [
  {
    id: "1",
    title: "Dune: Part Two",
    poster:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800",
    rating: "PG-13",
    score: 8.6,
    runtime: "2h 46m",
    genres: ["Sci-Fi", "Adventure", "Action"],
    language: "English",
    formats: ["2D", "3D", "IMAX"],
    comingSoon: false,
  },
  {
    id: "2",
    title: "Oppenheimer",
    poster:
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800",
    rating: "R",
    score: 8.9,
    runtime: "3h 00m",
    genres: ["Drama", "History"],
    language: "English",
    formats: ["2D", "IMAX"],
    comingSoon: false,
  },
  {
    id: "3",
    title: "Interstellar 2",
    poster:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800",
    rating: "PG-13",
    score: 0,
    runtime: "2h 30m",
    genres: ["Sci-Fi"],
    language: "English",
    formats: ["2D", "IMAX"],
    comingSoon: true,
    releaseLabel: "Releasing Dec 2026",
  },
];

export default function MoviesPage() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const [lang, setLang] = useState("All");
  const [fmt, setFmt] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

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
  const langs = ["All", "English", "Spanish", "Hindi", "French"];
  const fmts = ["All", "2D", "3D", "IMAX"];

  const isFiltering =
    search !== "" || genre !== "All" || lang !== "All" || fmt !== "All";

  const matchesFilters = (m: FilterableMovie) => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genre === "All" || m.genres.includes(genre);
    const matchLang = lang === "All" || m.language === lang;
    const matchFmt = fmt === "All" || m.formats.includes(fmt);
    return matchSearch && matchGenre && matchLang && matchFmt;
  };

  const nowShowing = MOVIES.filter((m) => !m.comingSoon && matchesFilters(m));
  const comingSoon = MOVIES.filter((m) => m.comingSoon && matchesFilters(m));
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
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
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
        {isFiltering && (
          <p className="text-slate-500 text-xs sm:text-sm font-medium mb-4">
            Showing{" "}
            <span className="text-white font-bold">{totalFiltered}</span> result
            {totalFiltered !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Empty State */}
      {isFiltering && totalFiltered === 0 && (
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
            <button
              onClick={resetFilters}
              className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-700 transition-all"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

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
    </div>
  );
}
