import {
  CURRENCIES,
  type CurrencyCode,
  type ICinemaRoom,
  type SeatCellType,
} from "../types/cinema.type";
import type { AuthUser } from "../types/auth-user.type";

const SEAT_CELL_TYPES: SeatCellType[] = [
  "seat",
  "double",
  "walkway",
  "stairs",
  "empty",
];

export const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export const toBoolean = (value: unknown): boolean =>
  value === true || String(value).toLowerCase() === "true";

export const toCurrency = (value: unknown): CurrencyCode | undefined => {
  const code = String(value ?? "").trim().toUpperCase();
  return (CURRENCIES as readonly string[]).includes(code)
    ? (code as CurrencyCode)
    : undefined;
};

export const parseObject = <T>(value: unknown): T | undefined => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  }
  return value as T;
};

/** First validation error for a room grid, or null. Unpaired doubles are normalized in place. */
export const getRoomError = (
  room: ICinemaRoom,
  index: number,
): string | null => {
  if (!room || typeof room !== "object") {
    return `Room ${index + 1} is not a valid object.`;
  }
  const where = `Room "${room.name?.trim() || index + 1}"`;
  if (!room.name || !room.name.trim()) {
    return `${where}: a room name is required.`;
  }
  if (!Number.isInteger(room.rows) || room.rows < 1) {
    return `${where}: rows must be a positive integer.`;
  }
  if (!Number.isInteger(room.cols) || room.cols < 1) {
    return `${where}: cols must be a positive integer.`;
  }
  if (!Array.isArray(room.grid) || room.grid.length !== room.rows) {
    return `${where}: grid must be an array with exactly ${room.rows} row(s).`;
  }
  for (let r = 0; r < room.grid.length; r++) {
    const row = room.grid[r];
    if (!Array.isArray(row) || row.length !== room.cols) {
      return `${where}: row ${r + 1} must have exactly ${room.cols} cell(s).`;
    }
    for (let c = 0; c < row.length; c++) {
      if (!SEAT_CELL_TYPES.includes(row[c])) {
        return `${where}: invalid cell "${String(row[c])}" at row ${
          r + 1
        }, col ${c + 1}.`;
      }
    }

    for (let c = 0; c < row.length; c++) {
      if (row[c] !== "double") continue;
      if (row[c + 1] === "double") {
        c += 1;
        continue;
      }
      row[c] = "seat";
    }
  }
  return null;
};

export const getRoomsError = (rooms: unknown): string | null => {
  if (!Array.isArray(rooms)) {
    return "rooms must be an array of room objects.";
  }
  if (rooms.length === 0) {
    return "At least one room with a valid seat layout grid is required.";
  }
  for (let i = 0; i < rooms.length; i++) {
    const error = getRoomError(rooms[i], i);
    if (error) return error;
  }
  return null;
};

/** True when the user owns the cinema, manages its owner, or is an admin. */
export const canManageCinema = (
  user: AuthUser | undefined,
  cinemaOwnerId: unknown,
): boolean => {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "cinema_staff") {
    return String(cinemaOwnerId) === String(user.managedByOwnerId);
  }
  return String(cinemaOwnerId) === user.id;
};
