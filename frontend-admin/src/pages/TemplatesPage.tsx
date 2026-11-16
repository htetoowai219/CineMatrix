import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Loader2,
  AlertCircle,
  Clapperboard,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import Modal from "../components/ui/Modal";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { useTemplateStore } from "../stores/template.store";
import { useCinemaStore } from "../stores/cinema.store";
import { useMovieStore } from "../stores/movie.store";
import { useParams, useNavigate } from "react-router";
import type { ICinema, SeatCellType } from "../types/cinema.type";
import type { IScreeningTemplate } from "../types/template.type";
import { formatCurrency, currencySymbol } from "../utils/currency";

const rowLabel = (index: number) => String.fromCharCode(65 + Math.min(index, 25));

const templateCinemaId = (template: IScreeningTemplate): string =>
  typeof template.cinemaId === "object" ? template.cinemaId._id : template.cinemaId;

const templateMovieId = (template: IScreeningTemplate): string =>
  typeof template.movieId === "object" ? template.movieId._id : template.movieId;

interface FormState {
  cinemaId: string;
  movieId: string;
  roomName: string;
  rowPrices: Record<string, string>;
}

const emptyForm = (cinemaId: string): FormState => ({
  cinemaId,
  movieId: "",
  roomName: "",
  rowPrices: {},
});

const PREVIEW_CELL_STYLES: Record<SeatCellType, string> = {
  seat: "border-red-500/50 bg-red-600/70",
  double: "border-rose-400/60 bg-rose-500/70",
  walkway: "border-slate-700/60 bg-slate-700/40",
  stairs: "border-amber-400/50 bg-amber-500/60",
  empty: "border-transparent bg-transparent",
};

const PREVIEW_CELL_LABELS: Record<SeatCellType, string> = {
  seat: "seat",
  double: "double seat",
  walkway: "walkway",
  stairs: "stairs",
  empty: "empty space",
};

const SeatPreviewRow = ({
  row,
  cols,
  rowIndex,
}: {
  row: SeatCellType[];
  cols: number;
  rowIndex: number;
}) => {
  const rowName = rowLabel(rowIndex);
  const cells: ReactNode[] = [];

  for (let c = 0; c < row.length; c += 1) {
    const cell = row[c];

    // Match the builder and real seat map: an adjacent double pair renders as
    // one wider loveseat spanning two columns.
    if (cell === "double" && row[c + 1] === "double") {
      cells.push(
        <span
          key={`double-${c}`}
          title={`Row ${rowName}, columns ${c + 1}-${c + 2}: double seat`}
          className={`col-span-2 h-3 rounded-[3px] border ${PREVIEW_CELL_STYLES.double}`}
        />,
      );
      c += 1;
      continue;
    }

    cells.push(
      <span
        key={`cell-${c}`}
        title={`Row ${rowName}, column ${c + 1}: ${PREVIEW_CELL_LABELS[cell]}`}
        className={`h-3 rounded-[3px] border ${PREVIEW_CELL_STYLES[cell]}`}
      />,
    );
  }

  return (
    <div
      role="img"
      aria-label={`Row ${rowName} seat layout`}
      className="grid w-max gap-[2px]"
      style={{ gridTemplateColumns: `repeat(${cols}, 0.625rem)` }}
    >
      {cells}
    </div>
  );
};

const LAYOUT_LEGEND: { label: string; cell: SeatCellType }[] = [
  { label: "Seat", cell: "seat" },
  { label: "Double ×2", cell: "double" },
  { label: "Walkway", cell: "walkway" },
  { label: "Stairs", cell: "stairs" },
];

export default function TemplatesPage() {
  const { cinemaId: routeCinemaId } = useParams<{ cinemaId: string }>();
  const navigate = useNavigate();
  const {
    templates,
    isLoading,
    isSubmitting,
    error,
    getTemplatesAction,
    createTemplateAction,
    updateTemplateAction,
    deleteTemplateAction,
    clearError,
  } = useTemplateStore();
  const { myCinemas, getMyCinemasAction } = useCinemaStore();
  const { movies, getAllMoviesAction } = useMovieStore();

  const [filterCinema, setFilterCinema] = useState<string>(
    routeCinemaId ?? "ALL",
  );
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<IScreeningTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IScreeningTemplate | null>(
    null,
  );
  const [form, setForm] = useState<FormState>(emptyForm(""));

  useEffect(() => {
    getTemplatesAction();
    getMyCinemasAction();
    getAllMoviesAction();
  }, [getTemplatesAction, getMyCinemasAction, getAllMoviesAction]);

  const activeFilter = routeCinemaId ?? filterCinema;

  const selectFilter = (cinemaId: string) => {
    setFilterCinema(cinemaId);
    if (routeCinemaId) navigate("/templates");
  };

  const movieOptions = useMemo(
    () =>
      movies.filter((m) => m.status !== "ARCHIVED" && m.status !== "PENDING_APPROVAL"),
    [movies],
  );

  const filtered = useMemo(() => {
    if (activeFilter === "ALL") return templates;
    return templates.filter((t) => templateCinemaId(t) === activeFilter);
  }, [templates, activeFilter]);

  const selectedCinema = useMemo<ICinema | undefined>(
    () => myCinemas.find((c) => c._id === form.cinemaId),
    [myCinemas, form.cinemaId],
  );

  const selectedRoom = useMemo(
    () => selectedCinema?.rooms?.find((r) => r.name === form.roomName),
    [selectedCinema, form.roomName],
  );

  const currencyAfterInput =
    (selectedCinema?.currency ?? "USD").toUpperCase() === "MMK";

  const openCreate = () => {
    setForm(emptyForm(activeFilter !== "ALL" ? activeFilter : myCinemas[0]?._id ?? ""));
    setShowCreate(true);
  };

  const openEdit = (template: IScreeningTemplate) => {
    setEditing(template);
    setForm({
      cinemaId: templateCinemaId(template),
      movieId: templateMovieId(template),
      roomName: template.roomName,
      rowPrices: Object.fromEntries(
        Object.entries(template.rowPrices).map(([k, v]) => [k, String(v)]),
      ),
    });
  };

  const initPricesForRoom = (
    cinema: ICinema | undefined,
    roomName: string,
    current: Record<string, string>,
  ): Record<string, string> => {
    const room = cinema?.rooms?.find((r) => r.name === roomName);
    if (!room) return current;
    const next: Record<string, string> = {};
    for (let i = 0; i < room.rows; i += 1) {
      const label = rowLabel(i);
      next[label] = current[label] ?? "";
    }
    return next;
  };

  const changeCinema = (cinemaId: string) => {
    setForm((prev) => ({
      cinemaId,
      movieId: prev.movieId,
      roomName: "",
      rowPrices: {},
    }));
  };

  const changeRoom = (roomName: string) => {
    setForm((prev) => {
      const prices = initPricesForRoom(
        myCinemas.find((c) => c._id === prev.cinemaId),
        roomName,
        {},
      );
      return { ...prev, roomName, rowPrices: prices };
    });
  };

  const setPrice = (label: string, value: string) => {
    const [whole, ...decimals] = value.replace(/[^\d.]/g, "").split(".");
    const normalized =
      decimals.length > 0 ? `${whole}.${decimals.join("")}` : whole;
    setForm((prev) => ({
      ...prev,
      rowPrices: { ...prev.rowPrices, [label]: normalized },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rowPrices: Record<string, number> = {};
    for (const [label, value] of Object.entries(form.rowPrices)) {
      const num = Number(value);
      if (value.trim() === "" || Number.isNaN(num) || num <= 0) {
        setErrorLocal(`Enter a valid price for row ${label}.`);
        return;
      }
      rowPrices[label] = num;
    }

    const payload = {
      cinemaId: form.cinemaId,
      movieId: form.movieId,
      roomName: form.roomName,
      rowPrices,
    };

    try {
      if (editing?._id) {
        await updateTemplateAction(String(editing._id), payload);
      } else {
        await createTemplateAction(payload);
      }
      setShowCreate(false);
      setEditing(null);
    } catch {
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      await deleteTemplateAction(String(deleteTarget._id));
      setDeleteTarget(null);
    } catch {
    }
  };

  const [localError, setErrorLocal] = useState<string | null>(null);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <p className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1">
            Partner Portal
          </p>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white uppercase tracking-wide">
            Screening Templates
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Pair a movie with a room layout and set the ticket price for each
            row. Screenings are created from these templates.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {(error || localError) && (
        <div className="mb-6 p-4 bg-red-950/50 border border-red-800 rounded-lg flex items-center justify-between text-red-200 text-sm">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            {localError ?? error}
          </span>
          <button
            type="button"
            onClick={() => {
              setErrorLocal(null);
              clearError();
            }}
            className="text-xs bg-red-900 hover:bg-red-800 px-3 py-1 rounded transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => selectFilter("ALL")}
          className={`text-xs px-3.5 py-2 rounded-full border transition-all whitespace-nowrap shrink-0 ${
            activeFilter === "ALL"
              ? "bg-red-600 border-red-600 text-white font-bold"
              : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
          }`}
        >
          All Cinemas
        </button>
        {myCinemas.map((cinema) => (
          <button
            key={String(cinema._id)}
            type="button"
            onClick={() => selectFilter(String(cinema._id))}
            className={`text-xs px-3.5 py-2 rounded-full border transition-all whitespace-nowrap shrink-0 ${
              activeFilter === cinema._id
                ? "bg-red-600 border-red-600 text-white font-bold"
                : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-white"
            }`}
          >
            {cinema.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-10 h-10 animate-spin text-red-600 mb-4" />
          <p className="text-sm">Loading templates...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 bg-slate-900/30 border border-slate-800/50 rounded-2xl">
          <Clapperboard className="w-12 h-12 mx-auto mb-4 text-slate-600 opacity-60" />
          <h3 className="font-display font-bold text-lg text-white mb-1 uppercase tracking-wide">
            No templates found
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Create a template to define the movie, room, and row prices for
            your screenings.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((template) => (
            <div
              key={String(template._id)}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-slate-700 transition-colors"
            >
              <div className="flex gap-4 p-5">
                {template.movie?.posterUrl ? (
                  <img
                    src={template.movie.posterUrl}
                    alt={template.movie.title}
                    className="w-16 h-24 object-cover rounded-lg border border-slate-800 shrink-0"
                  />
                ) : (
                  <div className="w-16 h-24 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                    <Clapperboard className="w-5 h-5 text-slate-500" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white truncate">
                    {template.movie?.title ?? "Unknown movie"}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {template.cinema?.name ?? "Cinema"} · {template.roomName}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {Object.entries(template.rowPrices).map(([row, price]) => (
                      <span
                        key={row}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300"
                      >
                        Row {row} · {formatCurrency(Number(price), template.cinema?.currency)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1.5 px-5 py-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => openEdit(template)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Edit template"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(template)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-950/40 transition-colors"
                  title="Delete template"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showCreate || editing) && (
        <Modal
          title={editing ? "Edit Template" : "New Screening Template"}
          subtitle="Pick a movie and room, then set the price for each row."
          onClose={() => {
            setShowCreate(false);
            setEditing(null);
          }}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                Cinema <span className="text-red-500">*</span>
              </label>
              <select
                value={form.cinemaId}
                onChange={(e) => changeCinema(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/60 transition-all disabled:opacity-50"
                disabled={isSubmitting || !!editing}
                required
              >
                <option value="" disabled>
                  Select cinema
                </option>
                {myCinemas.map((cinema) => (
                  <option key={String(cinema._id)} value={String(cinema._id)}>
                    {cinema.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                Movie <span className="text-red-500">*</span>
              </label>
              <select
                value={form.movieId}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, movieId: e.target.value }))
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/60 transition-all disabled:opacity-50"
                disabled={isSubmitting}
                required
              >
                <option value="" disabled>
                  Select movie
                </option>
                {movieOptions.map((movie) => (
                  <option key={String(movie._id)} value={String(movie._id)}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                Room <span className="text-red-500">*</span>
              </label>
              <select
                value={form.roomName}
                onChange={(e) => changeRoom(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-red-600/60 transition-all disabled:opacity-50"
                disabled={isSubmitting || !selectedCinema}
                required
              >
                <option value="" disabled>
                  Select room
                </option>
                {selectedCinema?.rooms?.map((room) => (
                  <option key={room.name} value={room.name}>
                    {room.name} ({room.rows} rows × {room.cols} cols)
                  </option>
                ))}
              </select>
            </div>

            {selectedRoom && (
              <div>
                <label className="mb-2 block text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  Price per row <span className="text-red-500">*</span>
                </label>

                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/50 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                        Room layout
                      </span>
                      <span className="text-[9px] text-slate-700">/</span>
                      <span className="truncate text-[9px] text-slate-500">
                        {selectedRoom.rows} rows × {selectedRoom.cols} cols
                      </span>
                    </div>
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                      Price ({selectedCinema?.currency || "USD"})
                    </span>
                  </div>

                  <div className="p-3 sm:p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700 to-slate-800" />
                      <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-600">
                        Screen
                      </span>
                      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-700 to-slate-800" />
                    </div>

                    <div className="flex flex-col gap-1">
                      {Object.keys(form.rowPrices).map((label, rowIndex) => {
                        const rowLayout = selectedRoom.grid[rowIndex] ?? [];

                        return (
                          <div
                            key={label}
                            className="grid grid-cols-[2.5rem_minmax(0,1fr)_7rem] items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-slate-900/60 sm:gap-3"
                          >
                            <span className="text-[10px] font-bold text-slate-500">
                              Row {label}
                            </span>

                            <div className="min-w-0 overflow-x-auto">
                              <SeatPreviewRow
                                row={rowLayout}
                                cols={selectedRoom.cols}
                                rowIndex={rowIndex}
                              />
                            </div>

                            <div className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-900 px-2 py-1.5 focus-within:border-red-600/60">
                              {!currencyAfterInput && (
                                <span className="shrink-0 text-xs text-slate-500">
                                  {currencySymbol(selectedCinema?.currency)}
                                </span>
                              )}
                              <input
                                type="text"
                                inputMode="decimal"
                                autoComplete="off"
                                spellCheck={false}
                                value={form.rowPrices[label]}
                                onChange={(e) => setPrice(label, e.target.value)}
                                placeholder="0.00"
                                aria-label={`Price for row ${label}`}
                                className="w-full min-w-0 bg-transparent text-right text-sm tabular-nums text-white focus:outline-none"
                              />
                              {currencyAfterInput && (
                                <span className="shrink-0 text-[10px] font-semibold text-slate-500">
                                  {currencySymbol(selectedCinema?.currency)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-slate-800/80 pt-3">
                      {LAYOUT_LEGEND.map(({ label, cell }) => (
                        <span
                          key={cell}
                          className="flex items-center gap-1.5 text-[9px] text-slate-500"
                        >
                          <span
                            className={`h-2.5 w-2.5 rounded-[2px] border ${PREVIEW_CELL_STYLES[cell]}`}
                          />
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowCreate(false);
                  setEditing(null);
                }}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-semibold text-xs px-5 py-2.5 rounded-lg transition-all shadow-md shadow-red-600/20 flex items-center gap-2"
              >
                {isSubmitting && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {editing ? "Save Changes" : "Create Template"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Template"
          message={`Delete the "${deleteTarget.movie?.title ?? ""}" template for ${deleteTarget.roomName}? Existing screenings are not affected.`}
          isSubmitting={isSubmitting}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
