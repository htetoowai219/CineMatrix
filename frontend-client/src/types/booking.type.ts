export type ScreeningSeatStatus = "available" | "held" | "booked";

export interface IScreeningSeat {
  label: string;
  row: string;
  isDouble: boolean;
  price: number;
  status: ScreeningSeatStatus;
}

export interface IScreening {
  _id?: string;
  templateId: string;
  cinemaId: string | { _id: string; name: string; address?: unknown; phone?: string; email?: string; allowPayInPerson?: boolean; currency?: string };
  movieId: string | { _id: string; title: string; posterUrl: string; backdropUrl?: string; durationMinutes: number; contentRating?: string };
  roomName: string;
  startTime: Date | string;
  endTime: Date | string;
  seats: IScreeningSeat[];
  createdBy: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled";
export type PaymentMethod = "screenshot" | "in_person";

export interface IBookingSeat {
  label: string;
  row: string;
  isDouble: boolean;
  price: number;
}

export interface IBooking {
  _id: string;
  userId: string;
  screeningId: string | IScreening;
  seats: IBookingSeat[];
  totalPrice: number;
  paymentMethod: PaymentMethod;
  paymentScreenshotUrl?: string;
  notes?: string;
  status: BookingStatus;
  expiresAt?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface FetchPublicScreeningResponse {
  message: string;
  screening: IScreening;
}

export interface FetchMyBookingsResponse {
  message: string;
  count: number;
  bookings: IBooking[];
}

export interface CreateBookingPayload {
  screeningId: string;
  seats: string[];
  paymentMethod: PaymentMethod;
  paymentScreenshotUrl?: string;
  notes?: string;
}
