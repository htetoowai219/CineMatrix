import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Play,
  Star,
  Clock,
  Calendar,
  Ticket,
  Heart,
  Share2,
  ArrowLeft,
} from "lucide-react";
import { addDays, format } from "date-fns";
import SectionLabel from "../components/SectionLabel";

// Types
export interface Showtime {
  id: string | number;
  time: string;
  format: string;
  hall: string;
  price: number;
}

export interface DetailedMovie {
  id: string;
  title: string;
  tagline: string;
  poster: string;
  backdrop: string;
  rating: string;
  score: number;
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
  distance: string;
}

// Mock Data
const MOVIES: DetailedMovie[] = [
  {
    id: "1",
    title: "Dune: Part Two",
    tagline: "Long live the fighters.",
    poster:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800",
    backdrop:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600",
    rating: "PG-13",
    score: 8.6,
    runtime: "2h 46m",
    releaseDate: "Mar 1, 2024",
    synopsis:
      "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future.",
    director: "Denis Villeneuve",
    language: "English",
    cast: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson", "Javier Bardem"],
    genres: ["Sci-Fi", "Adventure", "Action"],
    comingSoon: false,
  },
];

const CINEMAS: Cinema[] = [
  { id: "c1", name: "CineMatrix Downtown", distance: "1.2 mi" },
  { id: "c2", name: "CineMatrix Westside IMAX", distance: "3.5 mi" },
  { id: "c3", name: "CineMatrix Grand Plaza 4K", distance: "5.1 mi" },
  { id: "c4", name: "CineMatrix Northside ScreenX", distance: "7.8 mi" },
];

const SHOWTIMES: Showtime[] = [
  { id: 101, time: "1:15 PM", format: "IMAX 3D", hall: "Hall 1", price: 18.5 },
  {
    id: 102,
    time: "4:30 PM",
    format: "Dolby Atmos",
    hall: "Hall 4",
    price: 16.0,
  },
  { id: 103, time: "7:45 PM", format: "IMAX 3D", hall: "Hall 1", price: 18.5 },
  {
    id: 104,
    time: "10:15 PM",
    format: "Standard 2D",
    hall: "Hall 2",
    price: 13.5,
  },
];

export default function MovieDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const movie = MOVIES.find((m) => m.id === id) ?? MOVIES[0];

  const [selectedDate, setSelectedDate] = useState(0);
  const [selectedShowtime, setSelectedShowtime] = useState<Showtime | null>(
    null,
  );
  const [selectedCinema, setSelectedCinema] = useState<Cinema>(CINEMAS[0]);
  const [liked, setLiked] = useState(false);

  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  const handleBookTickets = (showtimeId?: string | number) => {
    const stId = showtimeId ?? selectedShowtime?.id ?? SHOWTIMES[0].id;
    navigate(
      `/screenings?movieId=${movie.id}&showtimeId=${stId}&cinemaId=${selectedCinema.id}`,
    );
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
          onClick={() => navigate("/movies")}
          className="absolute top-16 sm:top-24 left-4 sm:left-6 flex items-center gap-2 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-colors z-20 drop-shadow-md"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Movies
        </button>

        {/* Trailer Play Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/25 transition-all group active:scale-95 shadow-2xl">
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
              <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-bold text-sm sm:text-lg">
                  {movie.score}
                </span>
                <span className="text-slate-500 text-xs">/10</span>
              </div>

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
                  {movie.cast.join(", ")}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-center md:justify-start gap-3">
              {!movie.comingSoon && (
                <button
                  onClick={() => handleBookTickets()}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-all shadow-lg shadow-red-600/25"
                >
                  <Ticket className="w-4 h-4" /> Book Tickets
                </button>
              )}

              <button
                onClick={() => setLiked(!liked)}
                className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-all active:scale-95 ${
                  liked
                    ? "border-red-600/80 bg-red-950/30 text-red-500"
                    : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
              </button>

              <button className="w-11 h-11 rounded-lg border border-slate-800 bg-slate-900/80 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-all active:scale-95">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Showtimes & Booking Section */}
        {!movie.comingSoon && (
          <div className="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-slate-800/80">
            <div className="flex items-end justify-between mb-6">
              <div>
                <SectionLabel>Select Your Show</SectionLabel>
                <h2 className="font-display font-extrabold text-2xl sm:text-4xl text-white uppercase tracking-wide">
                  Showtimes
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 font-medium sm:hidden pb-1">
                Swipe left/right &rarr;
              </span>
            </div>

            {/* Date Picker Area with Fade Gradients */}
            <div className="relative mb-6 -mx-4 sm:mx-0">
              {/* Fade Overlays */}
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none sm:hidden" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none sm:hidden" />

              {/* Scroll Container */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none px-4 sm:px-0">
                {dates.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(i)}
                    className={`shrink-0 min-w-[85px] sm:min-w-[100px] px-3.5 py-2.5 rounded-xl border text-sm transition-all text-center ${
                      selectedDate === i
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

            {/* Cinema Selection Area with Fade Gradients */}
            <div className="relative mb-6 -mx-4 sm:mx-0">
              {/* Fade Overlays */}
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none sm:hidden" />
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none sm:hidden" />

              {/* Scroll Container */}
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none px-4 sm:px-0">
                {CINEMAS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCinema(c)}
                    className={`shrink-0 px-4 py-2 rounded-lg border text-xs sm:text-sm transition-all whitespace-nowrap ${
                      selectedCinema.id === c.id
                        ? "border-red-600/60 bg-red-950/30 text-white font-semibold"
                        : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-white"
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-slate-500 ml-2 font-mono text-xs">
                      {c.distance}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Responsive Showtime Options Grid */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {SHOWTIMES.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setSelectedShowtime(st);
                    handleBookTickets(st.id);
                  }}
                  className={`border rounded-xl p-3.5 sm:p-4 text-left transition-all hover:-translate-y-0.5 active:scale-95 ${
                    selectedShowtime?.id === st.id
                      ? "border-red-600 bg-red-950/20 shadow-md shadow-red-600/10"
                      : "border-slate-800/90 bg-slate-900/80 hover:border-slate-700"
                  }`}
                >
                  <div
                    className={`font-display font-bold text-base sm:text-lg ${
                      selectedShowtime?.id === st.id
                        ? "text-red-500"
                        : "text-white"
                    }`}
                  >
                    {st.time}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-slate-400">
                    <span className="font-medium text-slate-300">
                      {st.format}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span>{st.hall}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span className="font-bold text-slate-200">
                      ${st.price}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
