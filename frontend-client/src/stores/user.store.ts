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

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

interface RegisterResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface AuthResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface ProfileResponse {
  message: string;
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

  registerAction: (payload: RegisterPayload) => Promise<void>;
  loginAction: (payload: LoginPayload) => Promise<void>;
  logoutAction: () => Promise<void>;
  getProfileAction: () => Promise<void>;
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

      // Registers a new user account without auto-login
      registerAction: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          await api.post<RegisterResponse>("/user/register", payload);
        } catch (err: unknown) {
          const message = getErrorMessage(err, "Registration failed");
          set({ error: message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      // Authenticates user and stores non-sensitive user details and tokens
      loginAction: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post<AuthResponse>("/user/login", payload);
          set({
            user: {
              name: data.user.name,
              email: data.user.email,
              phone: data.user.phone,
            },
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

      // Revokes session on backend and clears auth state
      logoutAction: async () => {
        set({ isLoading: true });
        try {
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

      // Fetches user profile data using current access token
      getProfileAction: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.get<ProfileResponse>("/user/profile");
          set({
            user: {
              name: data.user.name,
              email: data.user.email,
              phone: data.user.phone,
            },
          });
        } catch (err: unknown) {
          const message = getErrorMessage(err, "Failed to fetch profile");
          set({ error: message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      // Updates user profile details and syncs local state
      updateProfileAction: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.patch<UpdateProfileResponse>(
            "/user/updateProfile",
            payload,
          );
          set((state) => ({
            user: {
              name: data.user.name ?? state.user?.name,
              email: data.user.email ?? state.user?.email,
              phone: data.user.phone ?? state.user?.phone,
            },
          }));
        } catch (err: unknown) {
          const message = getErrorMessage(err, "Profile update failed");
          set({ error: message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      // Updates user account password
      updatePasswordAction: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          await api.patch("/user/updatePassword", payload);
        } catch (err: unknown) {
          const message = getErrorMessage(err, "Password update failed");
          set({ error: message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      // Resets store error message
      clearError: () => set({ error: null }),

      // Performs local auth state cleanup without backend call
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
        user: state.user
          ? {
              name: state.user.name,
              email: state.user.email,
              phone: state.user.phone,
            }
          : null,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
