import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  MapPin,
  ChevronRight,
  Film,
  X,
  Loader2,
} from "lucide-react";
import SectionLabel from "../components/SectionLabel";
import { useCinemaStore } from "../stores/cinema.store";

export default function CinemasPage() {
  const navigate = useNavigate();

  // Store bindings
  const { cinemas, isLoading, error, getAllCinemasAction, clearError } =
    useCinemaStore();

  const [search, setSearch] = useState("");

  // Fetch cinemas on mount
  useEffect(() => {
    getAllCinemasAction();
  }, [getAllCinemasAction]);

  // Client-side search based on response from the backend
  const filtered = cinemas.filter((cinema) => {
    const fullAddress = `${cinema.address?.street || ""} ${cinema.address?.city || ""} ${cinema.address?.state || ""}`;
    return (
      cinema.name.toLowerCase().includes(search.toLowerCase()) ||
      cinema.address?.city.toLowerCase().includes(search.toLowerCase()) ||
      fullAddress.toLowerCase().includes(search.toLowerCase())
    );
  });

  const resetFilters = () => {
    setSearch("");
  };

  const hasActiveFilters = search !== "";

  return (
    <div className="bg-slate-950 min-h-screen text-white pt-24 pb-20 selection:bg-red-600 selection:text-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <SectionLabel>Find a Location</SectionLabel>
          <h1 className="font-display font-black text-4xl sm:text-5xl text-white uppercase tracking-wide">
            Cinemas
          </h1>
        </div>

        {/* Search Bar & Filter Chips */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              type="text"
              placeholder="Search by city, area, or cinema name..."
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

          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-slate-400 hover:text-red-500 underline px-2 transition-colors whitespace-nowrap shrink-0"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-800 rounded-lg flex items-center justify-between text-red-200 text-sm">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-xs bg-red-900 hover:bg-red-800 px-3 py-1 rounded transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
            <p className="text-sm">Loading cinemas...</p>
          </div>
        ) : (
          <>
            {/* Results Counter */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-500 text-xs sm:text-sm font-medium">
                Showing{" "}
                <span className="text-white font-bold">{filtered.length}</span>{" "}
                cinema
                {filtered.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Cinema Grid / Empty State */}
            {filtered.length === 0 ? (
              <div className="text-center py-24 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
                <Film className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-60" />
                <h3 className="font-display font-bold text-lg text-white mb-1 uppercase tracking-wide">
                  No cinemas found
                </h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                  We couldn't find any locations matching your search terms.
                </p>
                <button
                  onClick={resetFilters}
                  className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg border border-slate-700 transition-all"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((cinema) => {
                  const cinemaId = String(cinema._id);
                  const displayImage =
                    cinema.images && cinema.images.length > 0
                      ? cinema.images[0]
                      : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800";
                  const formattedAddress = `${cinema.address.street}, ${cinema.address.city}, ${cinema.address.country}`;

                  return (
                    <div
                      key={cinemaId}
                      onClick={() => navigate(`/cinemas/${cinemaId}`)}
                      className="group bg-slate-900/80 rounded-xl overflow-hidden border border-slate-800/90 hover:border-slate-700 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60 flex flex-col"
                    >
                      {/* Media Banner */}
                      <div className="relative h-52 overflow-hidden bg-slate-900 shrink-0">
                        <img
                          src={displayImage}
                          alt={cinema.name}
                          className="w-full h-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-90" />

                        {/* Room Count Badge */}
                        <div className="absolute bottom-3 left-3">
                          <span className="text-white text-xs font-bold bg-red-600 px-2.5 py-1 rounded-md shadow-md">
                            {cinema.rooms?.length ?? 0} Rooms
                          </span>
                        </div>
                      </div>

                      {/* Details Section */}
                      <div className="p-5 flex flex-col flex-1 justify-between">
                        <div>
                          <h3 className="font-display font-bold text-white text-xl uppercase tracking-wide mb-1.5 group-hover:text-red-500 transition-colors">
                            {cinema.name}
                          </h3>

                          <div className="flex items-start gap-1.5 text-slate-400 text-xs mb-4">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-red-500" />
                            <span className="line-clamp-2">
                              {formattedAddress}
                            </span>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="flex items-center justify-between pt-3.5 border-t border-slate-800/80">
                          <span className="text-slate-400 text-xs font-medium">
                            Available Now
                          </span>
                          <button className="flex items-center gap-1 text-red-500 text-xs font-bold group-hover:translate-x-0.5 transition-transform">
                            View Schedule <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
