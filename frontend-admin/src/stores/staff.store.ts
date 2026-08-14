import { create } from "zustand";
import { isAxiosError } from "axios";
import {
  type IManagedUser,
  type CreateStaffPayload,
} from "../types/manageUser.type";
import api from "../services/api";

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

interface StaffState {
  staff: IManagedUser[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  getStaffAction: () => Promise<void>;
  createStaffAction: (payload: CreateStaffPayload) => Promise<void>;
  deleteStaffAction: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useStaffStore = create<StaffState>()((set) => ({
  staff: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  // Fetches the staff members of the signed-in owner's cinemas.
  getStaffAction: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<{ staff: IManagedUser[] }>("/user/staff");
      set({ staff: data.staff });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch staff");
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Creates a new staff member for the signed-in owner (owner-only).
  createStaffAction: async (payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const { data } = await api.post<{
        message: string;
        user: IManagedUser;
      }>("/user/staff", payload);
      set((state) => ({
        staff: [
          { ...data.user, role: "cinema_staff" },
          ...state.staff.filter((s) => s._id !== data.user._id),
        ],
      }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to create staff");
      set({ error: message });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Deletes a staff member by ID (owner-only on the backend).
  deleteStaffAction: async (id: string) => {
    set({ isSubmitting: true, error: null });
    try {
      await api.delete<{ message: string }>(`/user/staff/${id}`);
      set((state) => ({
        staff: state.staff.filter((s) => s._id !== id),
      }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to delete staff");
      set({ error: message });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  clearError: () => set({ error: null }),
}));
