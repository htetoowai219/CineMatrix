import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Star,
  MapPin,
  Ticket,
  ArrowLeft,
  Zap,
  Volume2,
  Bookmark,
  Car,
  Coffee,
  Film,
  Wifi,
  Check,
} from "lucide-react";
import { addDays, format } from "date-fns";

// Types
export interface Cinema {
  id: string;
  name: string;
  address: string;
  image: string;
  rating: number;
  screens: number;
  distance: string;
  amenities: string[];
}

export interface Showtime {
  id: string | number;
  time: string;
  format: string;
}

export interface Movie {
  id: string;
  title: string;
  poster: string;
  rating: string;
  runtime: string;
  language: string;
  comingSoon?: boolean;
}

// Mock Data
const CINEMAS: Cinema[] = [
  {
    id: "c1",
    name: "CineMatrix Downtown",
    address: "742 Broadway, New York, NY 10003",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600",
    rating: 4.8,
    screens: 12,
    distance: "1.2 mi",
    amenities: [
      "IMAX",
      "Dolby Atmos",
      "VIP Lounge",
      "Parking",
      "Bar",
      "Food Court",
    ],
  },
];

const MOVIES: Movie[] = [
  {
    id: "1",
    title: "Dune: Part Two",
    poster:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800",
    rating: "PG-13",
    runtime: "2h 46m",
    language: "English",
    comingSoon: false,
  },
  {
    id: "2",
    title: "Oppenheimer",
    poster:
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800",
    rating: "R",
    runtime: "3h 00m",
    language: "English",
    comingSoon: false,
  },
];

const SHOWTIMES: Showtime[] = [
  { id: 101, time: "1:15 PM", format: "IMAX 3D" },
  { id: 102, time: "4:30 PM", format: "Dolby Atmos" },
  { id: 103, time: "7:45 PM", format: "IMAX 3D" },
  { id: 104, time: "10:15 PM", format: "Standard 2D" },
];

export default function CinemaDetailPage() {
  const { cinemaId } = useParams<{ cinemaId: string }>();
  const navigate = useNavigate();

  const cinema = CINEMAS.find((c) => c.id === cinemaId) ?? CINEMAS[0];
  const [activeDay, setActiveDay] = useState(0);

  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const galleryImages = [
    "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800",
    "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?w=800",
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800",
    "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800",
  ];

  const amenityIcons: Record<string, React.ReactNode> = {
    IMAX: <Zap className="w-4 h-4" />,
    "Dolby Atmos": <Volume2 className="w-4 h-4" />,
    "4DX": <Zap className="w-4 h-4" />,
    "VIP Lounge": <Bookmark className="w-4 h-4" />,
    Parking: <Car className="w-4 h-4" />,
    Bar: <Coffee className="w-4 h-4" />,
    "3D": <Film className="w-4 h-4" />,
    Valet: <Car className="w-4 h-4" />,
    "Cocktail Bar": <Coffee className="w-4 h-4" />,
    "Food Court": <Coffee className="w-4 h-4" />,
    Arcade: <Zap className="w-4 h-4" />,
    Wifi: <Wifi className="w-4 h-4" />,
    "2D": <Film className="w-4 h-4" />,
  };

  return (
    <div className="bg-slate-950 min-h-screen text-white selection:bg-red-600 selection:text-white">
      {/* Hero Header Image */}
      <div className="relative h-[35vh] sm:h-[45vh] min-h-[280px] max-h-[500px] overflow-hidden bg-slate-900">
        <img
          src={cinema.image}
          alt={cinema.name}
          className="w-full h-full object-cover opacity-35 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 to-transparent" />

        {/* Back Button */}
        <button
          onClick={() => navigate("/cinemas")}
          className="absolute top-16 sm:top-24 left-4 sm:left-6 flex items-center gap-2 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors z-20 drop-shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> All Cinemas
        </button>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-20 sm:-mt-32 relative z-10 pb-20">
        {/* Header Metadata */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-10">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-slate-800">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-bold text-sm">
                  {cinema.rating}
                </span>
              </div>
              <span className="text-slate-400 text-xs sm:text-sm font-medium">
                {cinema.screens} screens
              </span>
            </div>

            <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-white uppercase tracking-tight leading-none mb-2">
              {cinema.name}
            </h1>

            <div className="flex items-center gap-1.5 text-slate-400 text-xs sm:text-sm">
              <MapPin className="w-4 h-4 text-red-500 shrink-0" />
              <span>{cinema.address}</span>
            </div>
          </div>

          <button
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
          {/* Left Column: Amenities, Map & Gallery */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            {/* Amenities Section */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-800/90 p-5">
              <h3 className="font-display font-bold text-white uppercase tracking-wide mb-4 text-base">
                Amenities
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {cinema.amenities.map((a) => (
                  <div
                    key={a}
                    className="flex items-center gap-2.5 text-slate-300 text-xs font-medium"
                  >
                    <div className="text-red-500">
                      {amenityIcons[a] ?? <Check className="w-4 h-4" />}
                    </div>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Map Placeholder */}
            <div className="bg-slate-900/80 rounded-xl border border-slate-800/90 overflow-hidden">
              <div
                className="h-44 relative bg-slate-900"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 40px)",
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center flex-col gap-2">
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/40">
                    <MapPin className="w-5 h-5 text-white fill-white" />
                  </div>
                  <span className="text-slate-400 text-xs font-semibold">
                    View on Maps
                  </span>
                </div>
              </div>
              <div className="p-3.5 border-t border-slate-800/80">
                <p className="text-slate-400 text-xs leading-relaxed">
                  {cinema.address}
                </p>
                <p className="text-red-500 text-xs font-bold mt-1">
                  {cinema.distance} away
                </p>
              </div>
            </div>

            {/* Gallery Grid */}
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
          </div>

          {/* Right Column: Daily Schedule */}
          <div id="daily-schedule" className="lg:col-span-2">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white uppercase tracking-wide mb-5">
              Daily Schedule
            </h2>

            {/* Days Horizontal Scroll Container */}
            <div className="relative mb-6 -mx-4 sm:mx-0">
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none sm:hidden" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none sm:hidden" />

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none px-4 sm:px-0">
                {dates.map((d, i) => (
                  <button
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

            {/* Movie Schedule List */}
            <div className="flex flex-col gap-4">
              {MOVIES.filter((m) => !m.comingSoon).map((m) => (
                <div
                  key={m.id}
                  className="bg-slate-900/80 rounded-xl border border-slate-800/90 p-4 flex gap-4 hover:border-slate-700 transition-colors"
                >
                  <img
                    src={m.poster}
                    alt={m.title}
                    className="w-16 h-24 object-cover rounded-lg shrink-0 bg-slate-950 border border-slate-800/80"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-display font-bold text-white text-base sm:text-lg uppercase tracking-wide leading-tight truncate">
                        {m.title}
                      </h4>
                      <span className="bg-slate-800 text-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-700 shrink-0">
                        {m.rating}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-3">
                      <span>{m.runtime}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700" />
                      <span>{m.language}</span>
                    </div>

                    {/* Showtimes Grid */}
                    <div className="flex flex-wrap gap-2">
                      {SHOWTIMES.map((st) => (
                        <button
                          key={st.id}
                          onClick={() =>
                            navigate(
                              `/screenings?movieId=${m.id}&showtimeId=${st.id}&cinemaId=${cinema.id}`,
                            )
                          }
                          className="text-xs border border-slate-800 bg-slate-950/60 hover:border-red-600/60 hover:text-white text-slate-300 px-3 py-1.5 rounded-lg transition-all active:scale-95 flex items-center gap-1.5"
                        >
                          <span className="font-bold text-white">
                            {st.time}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {st.format}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
