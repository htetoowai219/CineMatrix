import { create } from "zustand";
import { isAxiosError } from "axios";
import {
  type IBooking,
  type CreateBookingPayload,
  type FetchMyBookingsResponse,
} from "../types/booking.type";
import api from "../services/api";

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

interface LockResponse {
  message: string;
  lockedSeats: string[];
  expiresInSeconds: number;
}

interface BookingMutationResponse {
  message: string;
  booking: IBooking;
}

interface UploadResponse {
  message: string;
  url: string;
}

interface BookingState {
  myBookings: IBooking[];
  isLoading: boolean;
  isLocking: boolean;
  isBooking: boolean;
  isUploading: boolean;
  error: string | null;

  lockSeatsAction: (screeningId: string, seats: string[]) => Promise<string[]>;
  unlockSeatsAction: (screeningId: string, seats: string[]) => Promise<void>;
  uploadPaymentScreenshotAction: (file: File) => Promise<string>;
  createBookingAction: (payload: CreateBookingPayload) => Promise<IBooking>;
  getMyBookingsAction: () => Promise<void>;
  cancelBookingAction: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useBookingStore = create<BookingState>()((set) => ({
  myBookings: [],
  isLoading: false,
  isLocking: false,
  isBooking: false,
  isUploading: false,
  error: null,

  // Locks seats on a screening (10-minute Redis hold) and returns the locked labels.
  lockSeatsAction: async (screeningId, seats) => {
    set({ isLocking: true, error: null });
    try {
      const { data } = await api.post<LockResponse>("/booking/lock", {
        screeningId,
        seats,
      });
      return data.lockedSeats;
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to lock seats");
      set({ error: message });
      throw err;
    } finally {
      set({ isLocking: false });
    }
  },

  // Releases a lock the customer holds on a screening's seats.
  unlockSeatsAction: async (screeningId, seats) => {
    try {
      await api.post("/booking/unlock", { screeningId, seats });
    } catch (err: unknown) {
      console.error("Failed to release seat lock:", err);
    }
  },

  // Uploads a payment screenshot and returns its hosted URL.
  uploadPaymentScreenshotAction: async (file) => {
    set({ isUploading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("paymentScreenshot", file);
      const { data } = await api.post<UploadResponse>("/booking/upload", formData);
      return data.url;
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to upload payment screenshot");
      set({ error: message });
      throw err;
    } finally {
      set({ isUploading: false });
    }
  },

  // Submits a booking. Seats must be available or held by this customer's lock.
  createBookingAction: async (payload) => {
    set({ isBooking: true, error: null });
    try {
      const { data } = await api.post<BookingMutationResponse>(
        "/booking",
        payload,
      );
      return data.booking;
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to create booking");
      set({ error: message });
      throw err;
    } finally {
      set({ isBooking: false });
    }
  },

  // Fetches the current user's bookings (newest first).
  getMyBookingsAction: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<FetchMyBookingsResponse>("/booking/my");
      set({ myBookings: data.bookings });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch bookings");
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Cancels one of the user's pending bookings and frees its seats.
  cancelBookingAction: async (id) => {
    set({ isBooking: true, error: null });
    try {
      await api.post(`/booking/${id}/cancel`);
      set((state) => ({
        myBookings: state.myBookings.map((b) =>
          b._id === id ? { ...b, status: "cancelled" as const } : b,
        ),
      }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to cancel booking");
      set({ error: message });
      throw err;
    } finally {
      set({ isBooking: false });
    }
  },

  clearError: () => set({ error: null }),
}));
