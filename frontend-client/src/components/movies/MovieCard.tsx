import { useNavigate } from "react-router";
import { Clock, Ticket, Bell } from "lucide-react";

export interface Movie {
  id: string;
  title: string;
  poster: string;
  rating: string;
  genres: string[];
  runtime: string;
  comingSoon?: boolean;
  releaseLabel?: string;
}

interface MovieCardProps {
  movie: Movie;
}

const MovieCard = ({ movie }: MovieCardProps) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/movies/${movie.id}`);
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents navigating to movie detail page when clicking the button
    navigate(`/screenings?movieId=${movie.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/60 flex flex-col h-full"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-slate-800">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 bg-slate-950/80 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold text-slate-300 border border-slate-700/50 uppercase">
          {movie.rating}
        </div>

        {movie.comingSoon && (
          <div className="absolute bottom-2 left-2 right-2 sm:bottom-2.5 sm:left-2.5 sm:right-2.5">
            <div className="bg-red-600/90 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold px-1.5 py-1 rounded text-center uppercase tracking-wider truncate">
              {movie.releaseLabel || "Coming Soon"}
            </div>
          </div>
        )}
      </div>

      <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <h3 className="font-display font-bold text-white text-sm sm:text-base leading-tight mb-1.5 sm:mb-2 uppercase tracking-wide truncate">
            {movie.title}
          </h3>

          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3">
            {movie.genres.slice(0, 2).map((g) => (
              <span
                key={g}
                className="text-[10px] sm:text-xs text-slate-400 bg-slate-800/80 px-1.5 sm:px-2 py-0.5 rounded-full border border-slate-700/50"
              >
                {g}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 mt-auto pt-1">
          {!movie.comingSoon ? (
            <>
              <div className="flex items-center gap-1 text-slate-400 text-[11px] sm:text-xs shrink-0">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{movie.runtime}</span>
              </div>
              <button
                onClick={handleBookClick}
                className="flex items-center justify-center gap-1 sm:gap-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-[11px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 rounded transition-all shadow-sm shrink-0"
              >
                <Ticket className="w-3 h-3" />
                <span>Book</span>
              </button>
            </>
          ) : (
            <button
              onClick={(e) => e.stopPropagation()}
              className="w-full flex items-center justify-center gap-1.5 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white text-[11px] sm:text-xs font-semibold py-1.5 rounded transition-colors"
            >
              <Bell className="w-3 h-3" />
              <span>Notify Me</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
