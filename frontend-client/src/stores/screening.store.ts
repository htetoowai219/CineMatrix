import { create } from "zustand";
import { isAxiosError } from "axios";
import {
  type IScreening,
  type FetchPublicScreeningResponse,
} from "../types/booking.type";
import api from "../services/api";

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

export interface FetchPublicScreeningsParams {
  movieId?: string;
  cinemaId?: string;
  date?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export interface FetchPublicScreeningsResponse {
  message: string;
  count: number;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  screenings: IScreening[];
}

interface ScreeningState {
  screenings: IScreening[];
  selectedScreening: IScreening | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  total: number;
  error: string | null;

  getPublicScreeningsAction: (
    params?: FetchPublicScreeningsParams,
    append?: boolean,
  ) => Promise<void>;
  getPublicScreeningByIdAction: (id: string) => Promise<void>;
  clearSelectedScreening: () => void;
  clearError: () => void;
}

export const useScreeningStore = create<ScreeningState>()((set) => ({
  screenings: [],
  selectedScreening: null,
  isLoading: false,
  isLoadingMore: false,
  hasMore: false,
  total: 0,
  error: null,

  // Fetches a page of public screenings. When `append` is true the result is
  // added to the existing list (used for "load more"); otherwise it replaces it.
  getPublicScreeningsAction: async (params, append = false) => {
    if (append) set({ isLoadingMore: true });
    else set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<FetchPublicScreeningsResponse>(
        "/screening/public",
        { params },
      );
      set((state) => ({
        screenings: append
          ? [...state.screenings, ...data.screenings]
          : data.screenings,
        hasMore: data.hasMore,
        total: data.total,
      }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch screenings");
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false, isLoadingMore: false });
    }
  },

  getPublicScreeningByIdAction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<FetchPublicScreeningResponse>(
        `/screening/public/${id}`,
      );
      set({ selectedScreening: data.screening });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch screening");
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  clearSelectedScreening: () => set({ selectedScreening: null }),

  clearError: () => set({ error: null }),
}));
