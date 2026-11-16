import { useEffect, useRef } from "react";
import { ExternalLink, X } from "lucide-react";
import { getYouTubeEmbedUrl, getYouTubeWatchUrl } from "../../utils/youtube";

interface TrailerModalProps {
  videoId: string;
  title: string;
  onClose: () => void;
}

const TrailerModal = ({ videoId, title, onClose }: TrailerModalProps) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto overscroll-contain bg-slate-950/90 p-3 backdrop-blur-md sm:p-6"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} trailer`}
          className="w-full max-w-5xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate font-display text-base font-bold uppercase tracking-wide text-white sm:text-xl">
                {title}
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 sm:text-xs">
                Official Trailer
              </p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Close trailer"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-slate-300 transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-700/80 bg-black shadow-2xl shadow-black/80">
            <iframe
              src={getYouTubeEmbedUrl(videoId)}
              title={`${title} trailer`}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>

          <div className="mt-3 flex justify-end">
            <a
              href={getYouTubeWatchUrl(videoId)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
            >
              Open on YouTube <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;
