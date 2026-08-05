import { create } from "zustand";
import { isAxiosError } from "axios";
import {
  type ICinema,
  type FetchCinemasParams,
  type FetchCinemasResponse,
  type FetchCinemaByIdResponse,
} from "../types/cinema.type";
import api from "../services/api";

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

interface CinemaState {
  cinemas: ICinema[];
  selectedCinema: ICinema | null;
  count: number;
  isLoading: boolean;
  error: string | null;

  getAllCinemasAction: (params?: FetchCinemasParams) => Promise<void>;
  getCinemaByIdAction: (id: string) => Promise<void>;
  clearSelectedCinema: () => void;
  clearError: () => void;
}

export const useCinemaStore = create<CinemaState>()((set) => ({
  cinemas: [],
  selectedCinema: null,
  count: 0,
  isLoading: false,
  error: null,

  // Fetches all cinemas with optional city and amenity filters
  getAllCinemasAction: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<FetchCinemasResponse>("/cinema", {
        params,
      });
      set({
        cinemas: data.cinemas,
        count: data.count,
      });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch cinemas");
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetches a single cinema by its unique database ID
  getCinemaByIdAction: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<FetchCinemaByIdResponse>(`/cinema/${id}`);
      set({ selectedCinema: data.cinema });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch cinema details");
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Clears the currently selected cinema details from state
  clearSelectedCinema: () => set({ selectedCinema: null }),

  // Resets store error message
  clearError: () => set({ error: null }),
}));
