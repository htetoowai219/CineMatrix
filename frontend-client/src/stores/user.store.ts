import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { isAxiosError } from "axios";
import {
  type User,
  type RegisterPayload,
  type LoginPayload,
  type UpdateProfilePayload,
  type UpdatePasswordPayload,
} from "../types/auth.type";
import api from "../services/api";

// Helper for extracting clean error messages from Axios responses
const getErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

interface RegisterResponse {
  message: string;
  user: User;
}

interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface UpdateProfileResponse {
  message: string;
  user: User;
}

interface UserState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Sync Store Actions with Backend API Calls
  registerAction: (payload: RegisterPayload) => Promise<void>;
  loginAction: (payload: LoginPayload) => Promise<void>;
  logoutAction: () => Promise<void>;
  updateProfileAction: (payload: UpdateProfilePayload) => Promise<void>;
  updatePasswordAction: (payload: UpdatePasswordPayload) => Promise<void>;
  clearError: () => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      registerAction: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          // POST /user/register -> expects name, email, password, phone
          // Only triggers registration without persisting tokens or auto-logging in
          await api.post<RegisterResponse>("/user/register", payload);
        } catch (err: unknown) {
          const message = getErrorMessage(err, "Registration failed");
          set({ error: message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      loginAction: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          // POST /user/login -> expects email, password
          const { data } = await api.post<AuthResponse>("/user/login", payload);
          set({
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
          });
        } catch (err: unknown) {
          const message = getErrorMessage(err, "Login failed");
          set({ error: message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      logoutAction: async () => {
        set({ isLoading: true });
        try {
          // DELETE /user/logout
          await api.delete("/user/logout");
        } catch (err: unknown) {
          console.error("Logout error on server:", err);
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      updateProfileAction: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          // PATCH /user/updateProfile -> expects name, phone (optional)
          const { data } = await api.patch<UpdateProfileResponse>(
            "/user/updateProfile",
            payload,
          );
          set((state) => ({
            user: state.user ? { ...state.user, ...data.user } : data.user,
          }));
        } catch (err: unknown) {
          const message = getErrorMessage(err, "Profile update failed");
          set({ error: message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      updatePasswordAction: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          // PATCH /user/updatePassword -> expects currentPassword, newPassword
          await api.patch("/user/updatePassword", payload);
        } catch (err: unknown) {
          const message = getErrorMessage(err, "Password update failed");
          set({ error: message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),

      // Internal manual cleanup helper
      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        }),
    }),
    {
      name: "cinematrix-user-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
