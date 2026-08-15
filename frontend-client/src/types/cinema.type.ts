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

export interface ICinema {
  _id?: string;
  name: string;
  description?: string;
  ownerId: string;
  address: ICinemaAddress;
  location?: ICinemaLocation;
  phone: string;
  email: string;
  images?: string[]; // Hero & banner images
  gallery?: string[]; // Additional interior / exterior gallery photos
  rooms: ICinemaRoom[];
  announcements?: ICinemaAnnouncement[];
  socials?: ICinemaSocials;
  allowPayInPerson: boolean;
  currency?: string;
  status: CinemaStatus;
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
