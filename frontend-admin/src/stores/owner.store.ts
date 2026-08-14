import { create } from "zustand";
import { isAxiosError } from "axios";
import {
  type IManagedUser,
  type CreateOwnerPayload,
} from "../types/manageUser.type";
import api from "../services/api";

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

interface OwnerState {
  owners: IManagedUser[];
  isLoading: boolean;
  isSubmitting: boolean;
  isDeleting: boolean;
  error: string | null;

  getOwnersAction: () => Promise<void>;
  createOwnerAction: (payload: CreateOwnerPayload) => Promise<void>;
  deleteOwnerAction: (id: string, adminPassword: string) => Promise<void>;
  clearError: () => void;
}

export const useOwnerStore = create<OwnerState>()((set) => ({
  owners: [],
  isLoading: false,
  isSubmitting: false,
  isDeleting: false,
  error: null,

  // Fetches all registered cinema owners (admin-only on the backend).
  getOwnersAction: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<{ owners: IManagedUser[] }>("/user/owners");
      set({ owners: data.owners });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch owners");
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Creates a new cinema owner account (admin-only on the backend).
  createOwnerAction: async (payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const { data } = await api.post<{
        message: string;
        user: IManagedUser;
      }>("/user/owners", payload);
      set((state) => ({
        owners: [
          { ...data.user, role: "cinema_owner" },
          ...state.owners.filter((o) => o._id !== data.user._id),
        ],
      }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to create owner");
      set({ error: message });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Deletes a cinema owner after the admin re-authenticates with their own
  // password (admin-only on the backend).
  deleteOwnerAction: async (id, adminPassword) => {
    set({ isDeleting: true, error: null });
    try {
      await api.delete<{ message: string }>(`/user/owners/${id}`, {
        data: { password: adminPassword },
      });
      set((state) => ({
        owners: state.owners.filter((o) => o._id !== id),
      }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to delete owner");
      set({ error: message });
      throw err;
    } finally {
      set({ isDeleting: false });
    }
  },

  clearError: () => set({ error: null }),
}));
