export type BookingPaymentMethod = "screenshot" | "in_person";

export type BookingStatus = "pending" | "confirmed" | "rejected" | "cancelled";

export interface IBookingSeat {
  label: string;
  row: string;
  isDouble: boolean;
  price: number;
}

export interface IBooking {
  _id?: string;
  // Owner/staff listing always returns these populated (Mongoose replaces the
  // raw IDs with the referenced documents).
  userId: { _id: string; name: string; email: string; phone: string };
  screeningId: {
    _id: string;
    startTime: string;
    roomName: string;
    movieId: { _id: string; title: string; posterUrl: string; durationMinutes: number };
    cinemaId: { _id: string; name: string };
  };
  seats: IBookingSeat[];
  totalPrice: number;
  paymentMethod: BookingPaymentMethod;
  paymentScreenshotUrl?: string;
  status: BookingStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FetchBookingsResponse {
  bookings: IBooking[];
  count: number;
}

export type BookingStatusUpdate = "approve" | "reject";
