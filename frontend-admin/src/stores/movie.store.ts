import { create } from "zustand";
import { isAxiosError } from "axios";
import {
  type IMovie,
  type MovieStatus,
  type CreateMoviePayload,
  type UpdateMoviePayload,
  type FetchMoviesParams,
  type FetchMoviesResponse,
  type MovieMutationResponse,
} from "../types/movie.type";
import api from "../services/api";

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

const STATUSES: MovieStatus[] = [
  "UPCOMING",
  "NOW_SHOWING",
  "ARCHIVED",
  "PENDING_APPROVAL",
];

interface MovieState {
  movies: IMovie[];
  selectedMovie: IMovie | null;
  count: number;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  getAllMoviesAction: (params?: FetchMoviesParams) => Promise<void>;
  getMovieByIdAction: (id: string) => Promise<void>;
  createMovieAction: (payload: CreateMoviePayload) => Promise<void>;
  updateMovieAction: (id: string, payload: UpdateMoviePayload) => Promise<void>;
  deleteMovieAction: (id: string) => Promise<void>;
  clearSelectedMovie: () => void;
  clearError: () => void;
}

export const useMovieStore = create<MovieState>()((set) => ({
  movies: [],
  selectedMovie: null,
  count: 0,
  isLoading: false,
  isSubmitting: false,
  error: null,

  // Fetches all movies with optional status/genre filters.
  getAllMoviesAction: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<FetchMoviesResponse>("/movie", { params });
      set({ movies: data.movies, count: data.count });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch movies");
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Fetches a single movie by its unique database ID.
  getMovieByIdAction: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<{ message: string; movie: IMovie }>(
        `/movie/${id}`,
      );
      set({ selectedMovie: data.movie });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch movie details");
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Creates a new movie (admin-only on the backend).
  createMovieAction: async (payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const { data } = await api.post<MovieMutationResponse>("/movie", payload);
      set((state) => ({ movies: [data.movie, ...state.movies], count: state.count + 1 }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to create movie");
      set({ error: message });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Updates an existing movie by ID (admin-only on the backend).
  updateMovieAction: async (id, payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const { data } = await api.patch<MovieMutationResponse>(
        `/movie/${id}`,
        payload,
      );
      set((state) => ({
        movies: state.movies.map((m) => (m._id === id ? data.movie : m)),
      }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to update movie");
      set({ error: message });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Deletes a movie by ID (admin-only on the backend).
  deleteMovieAction: async (id: string) => {
    set({ isSubmitting: true, error: null });
    try {
      await api.delete<{ message: string }>(`/movie/${id}`);
      set((state) => ({
        movies: state.movies.filter((m) => m._id !== id),
        count: Math.max(0, state.count - 1),
      }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to delete movie");
      set({ error: message });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Clears the currently selected movie from state.
  clearSelectedMovie: () => set({ selectedMovie: null }),

  // Resets the store error message.
  clearError: () => set({ error: null }),
}));

export { STATUSES };
