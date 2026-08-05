import { Types } from "mongoose";

// GeoJSON Point format for geospatial querying (e.g. finding nearby cinemas)
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

export interface ICinema {
  _id?: Types.ObjectId | string;
  name: string;
  description?: string;
  ownerId: Types.ObjectId | string; // Reference to User model (Cinema Admin / Manager)
  address: ICinemaAddress;
  location?: ICinemaLocation;
  phone: string;
  email: string;
  amenities?: string[]; // e.g. ["IMAX", "Dolby Atmos", "Recline Seats", "VIP Lounge", "Dine-In"]
  images?: string[]; // Hero / gallery image URLs
  totalScreens: number;
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
