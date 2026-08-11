import { create } from "zustand";
import { isAxiosError } from "axios";
import {
  type ICinema,
  type CreateCinemaPayload,
  type UpdateCinemaPayload,
  type FetchCinemasParams,
  type FetchCinemasResponse,
  type CinemaMutationResponse,
} from "../types/cinema.type";
import api from "../services/api";
import { toFormData } from "../utils/formData";

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

// Cinema mutations carry image files; when present the payload must be sent as
// multipart FormData so multer can receive the raw images.
const hasImageFiles = (
  payload: CreateCinemaPayload | UpdateCinemaPayload,
): boolean => !!(payload.imageFiles?.length || payload.galleryFiles?.length);

const toRequestBody = (
  payload: CreateCinemaPayload | UpdateCinemaPayload,
): CreateCinemaPayload | UpdateCinemaPayload | FormData =>
  hasImageFiles(payload)
    ? toFormData(payload as unknown as Record<string, unknown>)
    : payload;

interface CinemaState {
  cinemas: ICinema[];
  selectedCinema: ICinema | null;
  count: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  getAllCinemasAction: (params?: FetchCinemasParams) => Promise<void>;
  getCinemaByIdAction: (id: string) => Promise<void>;
  createCinemaAction: (payload: CreateCinemaPayload) => Promise<void>;
  updateCinemaAction: (
    id: string,
    payload: UpdateCinemaPayload,
  ) => Promise<void>;
  deleteCinemaAction: (id: string) => Promise<void>;
  clearSelectedCinema: () => void;
  clearError: () => void;
}

export const useCinemaStore = create<CinemaState>()((set) => ({
  cinemas: [],
  selectedCinema: null,
  count: 0,
  isLoading: false,
  isSubmitting: false,
  error: null,

  // Fetches all cinemas with optional city/amenity filters.
  getAllCinemasAction: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<FetchCinemasResponse>("/cinema", {
        params,
      });
      set({ cinemas: data.cinemas, count: data.count });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch cinemas");
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetches a single cinema by its unique database ID.
  getCinemaByIdAction: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<{ message: string; cinema: ICinema }>(
        `/cinema/${id}`,
      );
      set({ selectedCinema: data.cinema });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch cinema details");
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Creates a new cinema (admin-only on the backend).
  createCinemaAction: async (payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const { data } = await api.post<CinemaMutationResponse>(
        "/cinema",
        toRequestBody(payload),
      );
      set((state) => ({
        cinemas: [data.cinema, ...state.cinemas],
        count: state.count + 1,
      }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to create cinema");
      set({ error: message });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Updates an existing cinema by ID (admin-only on the backend).
  updateCinemaAction: async (id, payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const { data } = await api.patch<CinemaMutationResponse>(
        `/cinema/${id}`,
        toRequestBody(payload),
      );
      set((state) => ({
        cinemas: state.cinemas.map((c) => (c._id === id ? data.cinema : c)),
      }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to update cinema");
      set({ error: message });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Deletes a cinema by ID (admin-only on the backend).
  deleteCinemaAction: async (id: string) => {
    set({ isSubmitting: true, error: null });
    try {
      await api.delete<{ message: string }>(`/cinema/${id}`);
      set((state) => ({
        cinemas: state.cinemas.filter((c) => c._id !== id),
        count: Math.max(0, state.count - 1),
      }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to delete cinema");
      set({ error: message });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Clears the currently selected cinema from state.
  clearSelectedCinema: () => set({ selectedCinema: null }),

  // Resets the store error message.
  clearError: () => set({ error: null }),
}));
