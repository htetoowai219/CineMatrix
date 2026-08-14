import { create } from "zustand";
import { isAxiosError } from "axios";
import {
  type IBooking,
  type BookingStatus,
  type FetchBookingsResponse,
  type BookingStatusUpdate,
} from "../types/booking.type";
import api from "../services/api";

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

interface BookingState {
  bookings: IBooking[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  getBookingsAction: (status?: BookingStatus) => Promise<void>;
  updateBookingStatusAction: (
    id: string,
    action: BookingStatusUpdate,
  ) => Promise<void>;
  clearError: () => void;
}

export const useBookingStore = create<BookingState>()((set) => ({
  bookings: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  // Fetches bookings across the signed-in partner's cinemas.
  getBookingsAction: async (status) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<FetchBookingsResponse>("/booking", {
        params: status ? { status } : undefined,
      });
      set({ bookings: data.bookings });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch bookings");
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Approves or rejects a booking (owner/staff only).
  updateBookingStatusAction: async (id, action) => {
    set({ isSubmitting: true, error: null });
    try {
      const { data } = await api.patch<{ message: string; booking: IBooking }>(
        `/booking/${id}`,
        { action },
      );
      set((state) => ({
        // Only patch the status: the response booking is not re-populated,
        // so keep the rich userId/screeningId refs already in the list.
        bookings: state.bookings.map((b) =>
          b._id === id ? { ...b, status: data.booking.status } : b,
        ),
      }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to update booking");
      set({ error: message });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  clearError: () => set({ error: null }),
}));
