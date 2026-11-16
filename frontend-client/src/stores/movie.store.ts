import { create } from "zustand";
import { isAxiosError } from "axios";
import {
  type IMovie,
  type FetchMoviesParams,
  type FetchMoviesResponse,
  type FetchMovieByIdResponse,
} from "../types/movie.type";
import api from "../services/api";

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

interface MovieState {
  movies: IMovie[];
  selectedMovie: IMovie | null;
  count: number;
  isLoading: boolean;
  error: string | null;

  getAllMoviesAction: (params?: FetchMoviesParams) => Promise<void>;
  getMovieByIdAction: (id: string) => Promise<void>;
  clearSelectedMovie: () => void;
  clearError: () => void;
}

export const useMovieStore = create<MovieState>()((set) => ({
  movies: [],
  selectedMovie: null,
  count: 0,
  isLoading: false,
  error: null,

  getAllMoviesAction: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<FetchMoviesResponse>("/movie", {
        params,
      });
      set({
        movies: data.movies,
        count: data.count,
      });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch movies");
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  getMovieByIdAction: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<FetchMovieByIdResponse>(`/movie/${id}`);
      set({ selectedMovie: data.movie });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch movie details");
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  clearSelectedMovie: () => set({ selectedMovie: null }),

  clearError: () => set({ error: null }),
}));
