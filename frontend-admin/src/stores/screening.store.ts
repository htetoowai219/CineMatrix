import { create } from "zustand";
import { isAxiosError } from "axios";
import {
  type IScreening,
  type CreateScreeningPayload,
  type UpdateScreeningPayload,
  type ScreeningMutationResponse,
  type FetchScreeningsResponse,
} from "../types/screening.type";
import api from "../services/api";

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

// The backend populates movieId/cinemaId in place (objects), so map them onto
// the friendlier `movie`/`cinema` fields the UI reads.
const normalize = (screening: IScreening): IScreening => {
  const movie =
    screening.movieId && typeof screening.movieId === "object"
      ? screening.movieId
      : screening.movie;
  const cinema =
    screening.cinemaId && typeof screening.cinemaId === "object"
      ? screening.cinemaId
      : screening.cinema;
  return { ...screening, movie, cinema };
};

interface ScreeningState {
  screenings: IScreening[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  getScreeningsAction: () => Promise<void>;
  createScreeningAction: (payload: CreateScreeningPayload) => Promise<void>;
  updateScreeningAction: (
    id: string,
    payload: UpdateScreeningPayload,
  ) => Promise<void>;
  deleteScreeningAction: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useScreeningStore = create<ScreeningState>()((set) => ({
  screenings: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  // Fetches screenings for the signed-in partner's cinemas.
  getScreeningsAction: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<FetchScreeningsResponse>("/screening");
      set({ screenings: data.screenings.map(normalize) });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch screenings");
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Creates a screening from a template at a given start time.
  createScreeningAction: async (payload) => {
    set({ isSubmitting: true, error: null });
    try {
      await api.post<ScreeningMutationResponse>("/screening", payload);
      await useScreeningStore.getState().getScreeningsAction();
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to create screening");
      set({ error: message });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Reschedules an existing screening.
  updateScreeningAction: async (id, payload) => {
    set({ isSubmitting: true, error: null });
    try {
      await api.patch<ScreeningMutationResponse>(`/screening/${id}`, payload);
      await useScreeningStore.getState().getScreeningsAction();
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to update screening");
      set({ error: message });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Deletes a screening by ID.
  deleteScreeningAction: async (id: string) => {
    set({ isSubmitting: true, error: null });
    try {
      await api.delete<{ message: string }>(`/screening/${id}`);
      set((state) => ({
        screenings: state.screenings.filter((s) => s._id !== id),
      }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to delete screening");
      set({ error: message });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  clearError: () => set({ error: null }),
}));
