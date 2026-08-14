import type { SeatCellType } from "../types/cinema.type";

export const makeGrid = (rows: number, cols: number): SeatCellType[][] => {
  const template = Array.from({ length: cols }, () => "seat" as SeatCellType);
  return Array.from({ length: rows }, () => [...template]);
};
