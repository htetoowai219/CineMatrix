import type { SeatCellType } from "../types/cinema.type";

export const makeGrid = (rows: number, cols: number): SeatCellType[][] => {
  const template = Array.from({ length: cols }, () => "seat" as SeatCellType);
  return Array.from({ length: rows }, () => [...template]);
};

// A "double" seat is stored as two adjacent "double" cells. Any unpaired
// "double" cell is unsafe (it would render wider than one column), so it is
// downgraded to a normal seat.
export const normalizeDoublePairs = (
  grid: SeatCellType[][],
): SeatCellType[][] =>
  grid.map((row) => {
    const next = [...row];
    for (let c = 0; c < next.length; c += 1) {
      if (next[c] !== "double") continue;
      if (next[c + 1] === "double") {
        c += 1;
        continue;
      }
      next[c] = "seat";
    }
    return next;
  });

// Resizes a grid without discarding painted cells. New cells default to
// "seat"; pairs cut in half by a column shrink become normal seats.
export const resizeGrid = (
  grid: SeatCellType[][],
  rows: number,
  cols: number,
): SeatCellType[][] => {
  const next = Array.from({ length: rows }, (_, r) => {
    const existing = grid[r] ?? [];
    return Array.from(
      { length: cols },
      (_, c) => existing[c] ?? ("seat" as SeatCellType),
    );
  });
  return normalizeDoublePairs(next);
};

// Returns the other half of the double-seat pair containing `col`, using the
// same left-to-right pairing rule as the backend (and as rendering).
export const getDoublePartner = (
  row: SeatCellType[],
  col: number,
): number | null => {
  if (row[col] !== "double") return null;

  for (let c = 0; c < row.length; c += 1) {
    if (row[c] !== "double" || row[c + 1] !== "double") continue;
    if (c === col) return c + 1;
    if (c + 1 === col) return c;
    c += 1;
  }

  return null;
};

// Applies one paint action, keeping double seats in adjacent pairs.
export const applyPaint = (
  grid: SeatCellType[][],
  rowIndex: number,
  col: number,
  paint: SeatCellType,
): SeatCellType[][] => {
  const sourceRow = grid[rowIndex];
  if (!sourceRow || col < 0 || col >= sourceRow.length) return grid;

  const next = grid.map((row) => [...row]);
  const row = next[rowIndex];

  if (paint === "double") {
    if (row.length < 2) return grid;

    // The last column pairs leftwards so a double can always be placed.
    const start = col === row.length - 1 ? col - 1 : col;
    if (start < 0 || start + 1 >= row.length) return grid;

    // If either target cell belonged to a different pair, clear the old
    // partner so no orphaned half remains.
    for (const target of [start, start + 1]) {
      const partner = getDoublePartner(sourceRow, target);
      if (partner !== null && (partner < start || partner > start + 1)) {
        row[partner] = "empty";
      }
    }

    row[start] = "double";
    row[start + 1] = "double";
  } else {
    const partner = getDoublePartner(sourceRow, col);
    if (partner !== null) {
      row[partner] = "empty";
    }
    row[col] = paint;
  }

  return normalizeDoublePairs(next);
};
