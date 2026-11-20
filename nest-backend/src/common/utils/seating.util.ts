import type { ICinemaRoom } from "../types/cinema.type";
import type { IScreeningSeat } from "../types/screening.type";

/** Converts a zero-based row index into A, B, ... Z, AA, AB... */
export const rowLetter = (index: number): string => {
  let label = "";
  let i = index + 1;
  while (i > 0) {
    const rem = (i - 1) % 26;
    label = String.fromCharCode(65 + rem) + label;
    i = Math.floor((i - 1) / 26);
  }
  return label;
};

/**
 * Creates fresh seat instances from a room's grid. Doubles consume two adjacent
 * cells but become one bookable unit priced at 2x the row price.
 */
export const materializeSeats = (
  room: ICinemaRoom,
  rowPrices: Record<string, number> | Map<string, number>,
): { seats: IScreeningSeat[]; error?: string } => {
  const seats: IScreeningSeat[] = [];
  const prices: Record<string, number> =
    rowPrices instanceof Map ? Object.fromEntries(rowPrices) : rowPrices;

  for (let r = 0; r < room.rows; r++) {
    const rowLabel = rowLetter(r);
    const rowPrice = prices[rowLabel];
    const row = room.grid[r];
    let seatNumber = 0;

    for (let c = 0; c < row.length; c += 1) {
      const cell = row[c];
      if (cell !== "seat" && cell !== "double") continue;

      const isDouble = cell === "double";
      const hasPair = isDouble && row[c + 1] === "double";

      if (rowPrice === undefined || rowPrice <= 0) {
        return {
          seats,
          error: `Row ${rowLabel} has seats but no price configured in the template.`,
        };
      }

      seatNumber += 1;
      seats.push({
        label: `${rowLabel}${seatNumber}`,
        row: rowLabel,
        isDouble,
        price: isDouble ? rowPrice * 2 : rowPrice,
        status: "available",
      });

      if (hasPair) c += 1;
    }
  }

  return { seats };
};
