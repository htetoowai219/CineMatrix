import { Types } from "mongoose";

export interface ICinemaLocation {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ICinemaAddress {
  street: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
}

export interface ICinemaSocials {
  website?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
}

export interface ICinema {
  _id?: Types.ObjectId | string;
  name: string;
  description?: string;
  ownerId: Types.ObjectId | string;
  address: ICinemaAddress;
  location?: ICinemaLocation;
  phone: string;
  email: string;
  rating?: number;
  reviewsCount?: number;
  amenities?: string[];
  images?: string[]; // Hero & banner images
  gallery?: string[]; // Additional interior / exterior gallery photos
  totalScreens: number;
  openingHours?: string; // e.g., "10:00 AM - 12:00 AM"
  socials?: ICinemaSocials;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface FetchCinemasParams {
  city?: string;
  amenity?: string;
  lat?: number;
  lng?: number;
  maxDistanceKm?: number;
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
