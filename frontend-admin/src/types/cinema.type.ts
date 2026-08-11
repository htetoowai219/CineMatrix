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
  _id?: string;
  name: string;
  description?: string;
  ownerId: string;
  address: ICinemaAddress;
  location?: ICinemaLocation;
  phone: string;
  email: string;
  rating?: number;
  reviewsCount?: number;
  amenities?: string[];
  images?: string[];
  gallery?: string[];
  totalScreens: number;
  openingHours?: string;
  socials?: ICinemaSocials;
  isActive: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface CreateCinemaPayload {
  name: string;
  description?: string;
  ownerId: string;
  address: {
    street: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
  };
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
  phone: string;
  email: string;
  amenities?: string[];
  // Uploaded files take precedence over the URL arrays below.
  images?: string[];
  imageFiles?: File[];
  gallery?: string[];
  galleryFiles?: File[];
  totalScreens: number;
  openingHours?: string;
  isActive?: boolean;
}

export type UpdateCinemaPayload = Partial<CreateCinemaPayload>;

export interface FetchCinemasParams {
  city?: string;
  amenity?: string;
}

export interface FetchCinemasResponse {
  message: string;
  count: number;
  cinemas: ICinema[];
}

export interface CinemaMutationResponse {
  message: string;
  cinema: ICinema;
}

export interface MessageResponse {
  message: string;
}
