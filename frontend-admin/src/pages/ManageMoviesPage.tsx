import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Plus,
  Search,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  Clapperboard,
  Film,
  Star,
  Download,
  Check,
  X,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import StatusBadge from "../components/ui/StatusBadge";
import { Field, TextInput, TextArea, Select } from "../components/ui/form";
import ImageUpload from "../components/ui/ImageUpload";
import { useMovieStore, STATUSES } from "../stores/movie.store";
import {
  type IMovie,
  type MovieStatus,
  type CreateMoviePayload,
  type TmdbMoviePreview,
} from "../types/movie.type";

interface MovieFormState {
  title: string;
  tagline: string;
  synopsis: string;
  durationMinutes: string;
  releaseDate: string;
  originalLanguage: string;
  contentRating: string;
  posterUrl: string;
  backdropUrl: string;
  posterImage: File[];
  backdropImage: File[];
  trailerUrl: string;
  director: string;
  castMembers: string;
  genres: string;
  status: MovieStatus;
}

const emptyForm: MovieFormState = {
  title: "",
  tagline: "",
  synopsis: "",
  durationMinutes: "",
  releaseDate: "",
  originalLanguage: "",
  contentRating: "",
  posterUrl: "",
  backdropUrl: "",
  posterImage: [],
  backdropImage: [],
  trailerUrl: "",
  director: "",
  castMembers: "",
  genres: "",
  status: "UPCOMING",
};

const toDateInput = (value: Date | string | undefined): string => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : format(date, "yyyy-MM-dd");
};

const splitList = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const buildPayload = (form: MovieFormState): CreateMoviePayload => {
  const hasPosterFile = form.posterImage.length > 0;
  const hasBackdropFile = form.backdropImage.length > 0;

  return {
    title: form.title.trim(),
    tagline: form.tagline.trim() || undefined,
    synopsis: form.synopsis.trim(),
    durationMinutes: Number(form.durationMinutes),
    releaseDate: form.releaseDate,
    originalLanguage: form.originalLanguage.trim(),
    contentRating: form.contentRating.trim(),
    posterUrl: hasPosterFile ? undefined : form.posterUrl.trim(),
    backdropUrl: hasBackdropFile ? undefined : form.backdropUrl.trim(),
    posterImage: hasPosterFile ? form.posterImage[0] : undefined,
    backdropImage: hasBackdropFile ? form.backdropImage[0] : undefined,
    trailerUrl: form.trailerUrl.trim() || undefined,
    director: form.director.trim(),
    castMembers: splitList(form.castMembers),
    genres: splitList(form.genres),
    status: form.status,
  };
};

const toForm = (movie: IMovie): MovieFormState => ({
  title: movie.title,
  tagline: movie.tagline ?? "",
  synopsis: movie.synopsis ?? "",
  durationMinutes: movie.durationMinutes ? String(movie.durationMinutes) : "",
  releaseDate: toDateInput(movie.releaseDate),
  originalLanguage: movie.originalLanguage ?? "",
  contentRating: movie.contentRating ?? "",
  posterUrl: movie.posterUrl ?? "",
  backdropUrl: movie.backdropUrl ?? "",
  posterImage: [],
  backdropImage: [],
  trailerUrl: movie.trailerUrl ?? "",
  director: movie.director ?? "",
  castMembers: (movie.castMembers ?? []).join(", "),
  genres: (movie.genres ?? []).join(", "),
  status: movie.status ?? "UPCOMING",
});

export default function ManageMoviesPage() {
  const {
    movies,
    count,
    isLoading,
    isSubmitting,
    error,
    getAllMoviesAction,
    createMovieAction,
    updateMovieAction,
    deleteMovieAction,
    tmdbSearchAction,
    tmdbImportAction,
    clearError,
  } = useMovieStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | MovieStatus>("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<IMovie | null>(null);
  const [form, setForm] = useState<MovieFormState>(emptyForm);

  const [deleteTarget, setDeleteTarget] = useState<IMovie | null>(null);

  // TMDB import modal state
  const [tmdbOpen, setTmdbOpen] = useState(false);
  const [tmdbQuery, setTmdbQuery] = useState("");
  const [tmdbYear, setTmdbYear] = useState("");
  const [tmdbResults, setTmdbResults] = useState<TmdbMoviePreview[]>([]);
  const [tmdbSearching, setTmdbSearching] = useState(false);
  const [tmdbImportingId, setTmdbImportingId] = useState<number | null>(null);
  const [tmdbMessage, setTmdbMessage] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    getAllMoviesAction();
  }, [getAllMoviesAction]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return movies.filter((movie) => {
      const matchSearch =
        !term ||
        movie.title.toLowerCase().includes(term) ||
        (movie.genres ?? []).some((g) => g.toLowerCase().includes(term)) ||
        movie.director.toLowerCase().includes(term);
      const matchStatus =
        statusFilter === "ALL" || movie.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [movies, search, statusFilter]);

  const openCreate = () => {
    clearError();
    setEditingMovie(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (movie: IMovie) => {
    clearError();
    setEditingMovie(movie);
    setForm(toForm(movie));
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMovie?._id) {
        await updateMovieAction(String(editingMovie._id), buildPayload(form));
      } else {
        await createMovieAction(buildPayload(form));
      }
      setModalOpen(false);
      setEditingMovie(null);
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      await deleteMovieAction(String(deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      // Error is stored in the Zustand store state
    }
  };

  const openTmdb = () => {
    clearError();
    setTmdbMessage(null);
    setTmdbResults([]);
    setTmdbQuery("");
    setTmdbYear("");
    setTmdbOpen(true);
  };

  const handleTmdbSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = tmdbQuery.trim();
    if (!query) return;
    setTmdbMessage(null);
    setTmdbSearching(true);
    try {
      const results = await tmdbSearchAction(
        query,
        tmdbYear.trim() ? Number(tmdbYear.trim()) : undefined,
      );
      setTmdbResults(results);
      if (results.length === 0) {
        setTmdbMessage({ kind: "error", text: "No matches found on TMDB." });
      }
    } catch {
      // Error is stored in the Zustand store state
    } finally {
      setTmdbSearching(false);
    }
  };

  const handleTmdbImport = async (preview: TmdbMoviePreview) => {
    setTmdbMessage(null);
    setTmdbImportingId(preview.tmdbId);
    try {
      const movie = await tmdbImportAction(preview.tmdbId);
      setTmdbMessage({
        kind: "success",
        text: `"${movie.title}" imported and set to UPCOMING.`,
      });
    } catch {
      setTmdbMessage({
        kind: "error",
        text: `Could not import "${preview.title}". It may already exist in the catalog.`,
      });
    } finally {
      setTmdbImportingId(null);
    }
  };

  const update = (patch: Partial<MovieFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  // Creating a movie requires both poster and backdrop images.
  const canSubmit =
    !!editingMovie ||
    (form.posterImage.length > 0 && form.backdropImage.length > 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1">
            Catalog
          </p>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wide">
            Manage Movies
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {count} movie{count !== 1 ? "s" : ""} in the global catalog.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openTmdb}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 hover:text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-all shadow-md border border-slate-700 shrink-0"
          >
            <Download className="w-4 h-4" /> Import from TMDB
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-all shadow-lg shadow-red-600/25 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Movie
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, genre, or director..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-600/60 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`text-xs px-3.5 py-2 rounded-full border transition-all whitespace-nowrap shrink-0 ${
              statusFilter === "ALL"
                ? "bg-red-600 border-red-600 text-white font-bold"
                : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
            }`}
          >
            All
          </button>
          {STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`text-xs px-3.5 py-2 rounded-full border transition-all whitespace-nowrap shrink-0 ${
                statusFilter === status
                  ? "bg-red-600 border-red-600 text-white font-bold"
                  : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
              }`}
            >
              {status.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-950/50 border border-red-800 rounded-lg flex items-center justify-between text-red-200 text-sm">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            {error}
          </span>
          <button
            type="button"
            onClick={clearError}
            className="text-xs bg-red-900 hover:bg-red-800 px-3 py-1 rounded transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
          <p className="text-sm">Loading movies...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
          <Clapperboard className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-60" />
          <h3 className="font-display font-bold text-lg text-white mb-1 uppercase tracking-wide">
            No movies found
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Add your first movie to the catalog or adjust your search filters.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all"
          >
            Add Movie
          </button>
        </div>
      ) : (
        /* Table */
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-[11px] font-bold uppercase tracking-widest border-b border-slate-800">
                  <th className="px-5 py-3.5">Movie</th>
                  <th className="px-5 py-3.5 hidden md:table-cell">Genres</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 hidden lg:table-cell">Runtime</th>
                  <th className="px-5 py-3.5 hidden lg:table-cell">Release</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((movie) => (
                  <tr key={String(movie._id)} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="w-10 h-14 object-cover rounded-md bg-slate-800 border border-slate-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate max-w-[220px]">
                            {movie.title}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[220px]">
                            {movie.director} · {movie.originalLanguage}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(movie.genres ?? []).slice(0, 2).map((genre) => (
                          <span
                            key={genre}
                            className="text-[10px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {movie.status ? (
                        <StatusBadge label={movie.status} />
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-slate-300">
                      {movie.durationMinutes}m
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-slate-300">
                      {format(new Date(movie.releaseDate), "MMM d, yyyy")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(movie)}
                          title="Edit movie"
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(movie)}
                          title="Delete movie"
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit modal */}
      {modalOpen && (
        <Modal
          title={editingMovie ? "Edit Movie" : "Add Movie"}
          subtitle={
            editingMovie
              ? `Updating "${editingMovie.title}"`
              : "Register a new title in the global movie catalog."
          }
          onClose={() => {
            if (!isSubmitting) {
              setModalOpen(false);
              setEditingMovie(null);
            }
          }}
          maxWidth="max-w-3xl"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-950/50 border border-red-600/50 rounded-lg text-red-400 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Title" required>
                  <TextInput
                    type="text"
                    value={form.title}
                    onChange={(e) => update({ title: e.target.value })}
                    placeholder="Dune: Part Two"
                    required
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Tagline" hint="Short promotional line shown on movie cards.">
                  <TextInput
                    type="text"
                    value={form.tagline}
                    onChange={(e) => update({ tagline: e.target.value })}
                    placeholder="Long live the fighters."
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Synopsis" required>
                  <TextArea
                    rows={3}
                    value={form.synopsis}
                    onChange={(e) => update({ synopsis: e.target.value })}
                    placeholder="Brief plot summary of the film..."
                    required
                  />
                </Field>
              </div>

              <Field label="Duration (minutes)" required>
                <TextInput
                  type="number"
                  min={1}
                  value={form.durationMinutes}
                  onChange={(e) => update({ durationMinutes: e.target.value })}
                  placeholder="166"
                  required
                />
              </Field>

              <Field label="Release Date" required>
                <TextInput
                  type="date"
                  value={form.releaseDate}
                  onChange={(e) => update({ releaseDate: e.target.value })}
                  required
                />
              </Field>

              <Field label="Original Language" required>
                <TextInput
                  type="text"
                  value={form.originalLanguage}
                  onChange={(e) => update({ originalLanguage: e.target.value })}
                  placeholder="English"
                  required
                />
              </Field>

              <Field label="Content Rating" required>
                <TextInput
                  type="text"
                  value={form.contentRating}
                  onChange={(e) => update({ contentRating: e.target.value })}
                  placeholder="PG-13"
                  required
                />
              </Field>

              <Field label="Director" required>
                <TextInput
                  type="text"
                  value={form.director}
                  onChange={(e) => update({ director: e.target.value })}
                  placeholder="Denis Villeneuve"
                  required
                />
              </Field>

              <Field label="Status">
                <Select
                  value={form.status}
                  onChange={(e) => update({ status: e.target.value as MovieStatus })}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Genres" hint="Comma-separated, e.g. Action, Sci-Fi">
                <TextInput
                  type="text"
                  value={form.genres}
                  onChange={(e) => update({ genres: e.target.value })}
                  placeholder="Action, Sci-Fi, Drama"
                />
              </Field>

              <Field label="Cast Members" hint="Comma-separated">
                <TextInput
                  type="text"
                  value={form.castMembers}
                  onChange={(e) => update({ castMembers: e.target.value })}
                  placeholder="Timothée Chalamet, Zendaya"
                />
              </Field>

              <div className="sm:col-span-2">
                <ImageUpload
                  label="Poster Image"
                  required={!editingMovie}
                  hint="Portrait movie poster. The file is uploaded to Cloudinary and its URL is stored."
                  currentSrc={editingMovie ? form.posterUrl : undefined}
                  files={form.posterImage}
                  onChange={(files) => update({ posterImage: files })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="sm:col-span-2">
                <ImageUpload
                  label="Backdrop Image"
                  required={!editingMovie}
                  hint="Wide banner / hero image. The file is uploaded to Cloudinary and its URL is stored."
                  currentSrc={editingMovie ? form.backdropUrl : undefined}
                  files={form.backdropImage}
                  onChange={(files) => update({ backdropImage: files })}
                  disabled={isSubmitting}
                  previewClassName="w-28 h-16"
                />
              </div>

              <Field label="Trailer URL">
                <TextInput
                  type="url"
                  value={form.trailerUrl}
                  onChange={(e) => update({ trailerUrl: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false);
                  setEditingMovie(null);
                }}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !canSubmit}
                className="bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20 flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editingMovie ? "Save Changes" : "Create Movie"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* TMDB Import Modal */}
      {tmdbOpen && (
        <Modal
          title="Import from TMDB"
          subtitle="Search The Movie Database and pull a title with its metadata, trailer, and artwork."
          onClose={() => {
            if (!isSubmitting) setTmdbOpen(false);
          }}
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleTmdbSearch} className="mb-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={tmdbQuery}
                  onChange={(e) => setTmdbQuery(e.target.value)}
                  placeholder="Search TMDB (e.g. Dune, Oppenheimer...)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all"
                  required
                />
              </div>
              <div className="w-full sm:w-28">
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={tmdbYear}
                  onChange={(e) => setTmdbYear(e.target.value)}
                  placeholder="Year"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-600/60 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={tmdbSearching || isSubmitting}
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all"
              >
                {tmdbSearching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5" />
                )}
                Search
              </button>
            </div>
          </form>

          {(error || tmdbMessage) && (
            <div
              className={`mb-4 p-3 rounded-lg text-xs font-semibold flex items-start justify-between gap-2 ${
                tmdbMessage?.kind === "success"
                  ? "bg-emerald-950/50 border border-emerald-600/50 text-emerald-400"
                  : "bg-red-950/50 border border-red-600/50 text-red-400"
              }`}
            >
              <span>{tmdbMessage?.text || error}</span>
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setTmdbMessage(null);
                }}
                className="shrink-0 text-current opacity-70 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {tmdbResults.length === 0 && !tmdbSearching ? (
            <div className="text-center py-14 bg-slate-950/40 border border-slate-800/50 rounded-xl">
              <Film className="w-10 h-10 mx-auto mb-3 text-slate-600 opacity-60" />
              <p className="text-slate-400 text-sm">
                Search TMDB to discover titles to import into the catalog.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {tmdbResults.map((result) => (
                <div
                  key={result.tmdbId}
                  className="flex gap-3 bg-slate-950/60 border border-slate-800 rounded-xl p-3 hover:border-slate-700 transition-colors"
                >
                  <img
                    src={
                      result.posterUrl ||
                      "https://via.placeholder.com/100x150?text=No+Poster"
                    }
                    alt={result.title}
                    className="w-14 h-20 object-cover rounded-md bg-slate-800 border border-slate-800 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate">
                      {result.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {result.releaseDate ? result.releaseDate.slice(0, 4) : "—"}{" "}
                      · {result.language.toUpperCase()}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-amber-400 mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {result.rating.toFixed(1)}
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                      {result.overview || "No synopsis available."}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {result.genres.slice(0, 3).map((g) => (
                        <span
                          key={g}
                          className="text-[10px] text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded-full border border-slate-700/70"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleTmdbImport(result)}
                    title={`Import ${result.title}`}
                    className="self-center shrink-0 p-2 rounded-lg bg-red-600/20 hover:bg-red-600 hover:text-white text-red-500 border border-red-600/40 transition-all disabled:opacity-50"
                  >
                    {tmdbImportingId === result.tmdbId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete Movie"
          message={`Are you sure you want to permanently delete "${deleteTarget.title}"? This action cannot be undone.`}
          isSubmitting={isSubmitting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
