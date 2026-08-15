import { Types } from "mongoose";

export type CinemaStatus = "pending" | "active" | "rejected";

export interface ICinemaLocation {
  lat: number;
  lng: number;
}

export interface ICinemaAddress {
  street: string;
  city: string;
  state?: string;
  country: string;
}

export interface ICinemaSocials {
  website?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
}

// Cell types in a room's seat grid.
// - seat   : single seat (1 ticket)
// - double : loveseat (2 tickets, priced at 2x the row's single price)
// - walkway: aisle / walking path (not bookable)
// - stairs : staircase (not bookable)
// - empty  : unused cell (not bookable)
export type SeatCellType = "seat" | "double" | "walkway" | "stairs" | "empty";

export interface ICinemaRoom {
  name: string;
  rows: number;
  cols: number;
  grid: SeatCellType[][];
}

export interface ICinemaAnnouncement {
  title?: string;
  body?: string;
  imageUrl?: string;
}

// ISO 4217 currency codes the cinema can price tickets in.
export const CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "MMK",
  "THB",
  "SGD",
  "MYR",
  "IDR",
  "PHP",
  "VND",
  "INR",
  "JPY",
  "KRW",
  "AUD",
  "CAD",
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export interface ICinema {
  _id?: Types.ObjectId | string;
  name: string;
  description?: string;
  ownerId: Types.ObjectId | string;
  address: ICinemaAddress;
  location?: ICinemaLocation;
  phone: string;
  email: string;
  images?: string[]; // Hero & banner images
  gallery?: string[]; // Additional interior / exterior gallery photos
  rooms: ICinemaRoom[];
  announcements?: ICinemaAnnouncement[]; // Image slider shown on the cinema page
  socials?: ICinemaSocials;
  allowPayInPerson: boolean; // Whether customers may choose to pay at the cinema
  currency?: CurrencyCode; // Currency ticket prices are displayed and charged in
  status: CinemaStatus; // pending -> active after admin approval
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface FetchCinemasParams {
  city?: string;
}

export interface FetchCinemasResponse {
  message: string;
  count: number;
  cinemas: ICinema[];
}

export interface FetchCinemaByIdResponse {
  message: string;
  cinema: ICinema;
}
