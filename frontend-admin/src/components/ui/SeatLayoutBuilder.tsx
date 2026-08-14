import { useEffect, useState } from "react";
import { Eraser, PaintBucket, MousePointerClick, Minus, Plus } from "lucide-react";
import type { SeatCellType } from "../../types/cinema.type";
import { makeGrid } from "../../utils/seatLayout";

const paintLabel = (row: number): string =>
  String.fromCharCode(65 + Math.min(row, 25));

const CELL_STYLES: Record<SeatCellType, string> = {
  seat: "bg-red-600/80 border border-red-500/60",
  double: "bg-rose-600/80 border border-rose-400/60",
  walkway: "bg-slate-700/40 border border-slate-700/60",
  stairs: "bg-amber-500/60 border border-amber-400/50",
  empty: "border border-dashed border-slate-800",
};

interface SeatLayoutBuilderProps {
  rows: number;
  cols: number;
  grid: SeatCellType[][];
  onChangeGrid: (grid: SeatCellType[][]) => void;
  onChangeRows: (rows: number) => void;
  onChangeCols: (cols: number) => void;
  disabled?: boolean;
}

const PAINT_OPTIONS: { type: SeatCellType; label: string; swatch: string }[] = [
  { type: "seat", label: "Seat", swatch: "bg-red-600/80" },
  { type: "double", label: "Double", swatch: "bg-rose-600/80" },
  { type: "walkway", label: "Walkway", swatch: "bg-slate-500/40" },
  { type: "stairs", label: "Stairs", swatch: "bg-amber-500/60" },
  { type: "empty", label: "Empty", swatch: "border border-dashed border-slate-500" },
];

const SeatLayoutBuilder = ({
  rows,
  cols,
  grid,
  onChangeGrid,
  onChangeRows,
  onChangeCols,
  disabled = false,
}: SeatLayoutBuilderProps) => {
  const [paint, setPaint] = useState<SeatCellType>("seat");

  useEffect(() => {
    if (!grid.length) onChangeGrid(makeGrid(rows, cols));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCell = (r: number, c: number) => {
    if (disabled) return;
    const next = grid.map((rowArr) => [...rowArr]);
    next[r][c] = paint;
    onChangeGrid(next);
  };

  const paintAll = () => {
    if (disabled) return;
    onChangeGrid(makeGrid(rows, cols).map((rowArr) => rowArr.map(() => paint)));
  };

  const resizeRows = (delta: number) => {
    const nextRows = Math.max(1, Math.min(30, rows + delta));
    onChangeRows(nextRows);
  };

  const resizeCols = (delta: number) => {
    const nextCols = Math.max(1, Math.min(30, cols + delta));
    onChangeCols(nextCols);
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          <MousePointerClick className="w-3.5 h-3.5" />
          Paint
        </span>
        {PAINT_OPTIONS.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => setPaint(option.type)}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50 ${
              paint === option.type
                ? "bg-red-600/20 text-red-400 border border-red-600/50"
                : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-white"
            }`}
          >
            <span className={`w-3 h-3 rounded-sm ${option.swatch}`} />
            {option.label}
          </button>
        ))}
        <button
          type="button"
          onClick={paintAll}
          disabled={disabled}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:text-white transition-colors disabled:opacity-50"
        >
          <PaintBucket className="w-3.5 h-3.5" />
          Fill
        </button>
        <button
          type="button"
          onClick={() => !disabled && onChangeGrid(makeGrid(rows, cols))}
          disabled={disabled}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 bg-slate-900 border border-slate-800 hover:text-red-400 transition-colors disabled:opacity-50"
        >
          <Eraser className="w-3.5 h-3.5" />
          Clear
        </button>
      </div>

      {/* Size controls */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Rows
          </span>
          <button
            type="button"
            onClick={() => resizeRows(-1)}
            disabled={disabled || rows <= 1}
            className="p-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-8 text-center text-xs font-bold text-white">
            {rows}
          </span>
          <button
            type="button"
            onClick={() => resizeRows(1)}
            disabled={disabled || rows >= 30}
            className="p-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Columns
          </span>
          <button
            type="button"
            onClick={() => resizeCols(-1)}
            disabled={disabled || cols <= 1}
            className="p-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
          >
            <Minus className="w-3 h-3" />
          </button>
          <span className="w-8 text-center text-xs font-bold text-white">
            {cols}
          </span>
          <button
            type="button"
            onClick={() => resizeCols(1)}
            disabled={disabled || cols >= 30}
            className="p-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div
          className="inline-block p-4 rounded-xl bg-slate-950 border border-slate-800"
          style={{ minWidth: "100%" }}
        >
          <div className="flex items-center justify-center mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
              Screen
            </span>
            <span className="w-full max-w-md mx-3 h-1 rounded-full bg-slate-800" />
          </div>
          <div className="flex flex-col items-start gap-1">
            {grid.map((rowArr, r) => (
              <div key={r} className="flex items-center gap-1">
                <span className="w-5 text-right text-[10px] font-bold text-slate-600 pr-1">
                  {paintLabel(r)}
                </span>
                {rowArr.map((cell, c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCell(r, c)}
                    disabled={disabled}
                    title={`${paintLabel(r)}${c + 1} (${cell})`}
                    className={`w-6 h-6 rounded-sm transition-colors disabled:cursor-default ${CELL_STYLES[cell]}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatLayoutBuilder;
