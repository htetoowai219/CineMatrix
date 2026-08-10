import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { isAxiosError } from "axios";
import {
  type User,
  type UserRole,
  type LoginPayload,
  type JwtPayload,
} from "../types/auth.type";
import api from "../services/api";
import { decodeJwtPayload } from "../utils/jwt";

const ADMIN_ROLE: UserRole = "admin";
const ADMIN_GATE_ERROR =
  "Access denied. This account has no admin privileges.";

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

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

interface UserState {
  user: User | null;
  role: UserRole | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  loginAction: (payload: LoginPayload) => Promise<void>;
  logoutAction: () => Promise<void>;
  getProfileAction: () => Promise<void>;
  clearError: () => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Authenticates the user and gates the session to super admins only.
      loginAction: async (payload) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post<AuthResponse>("/user/login", payload);

          const decoded = decodeJwtPayload<JwtPayload>(data.accessToken);
          const role = decoded?.role ?? null;

          if (role !== ADMIN_ROLE) {
            // Reject non-admin sessions and revoke the token server-side.
            await api.delete("/user/logout", {
              headers: { Authorization: `Bearer ${data.accessToken}` },
            });
            set({
              user: null,
              role: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              error: ADMIN_GATE_ERROR,
            });
            const gateError = new Error(ADMIN_GATE_ERROR) as Error & {
              __adminGate?: boolean;
            };
            gateError.__adminGate = true;
            throw gateError;
          }

          set({
            user: {
              name: data.user.name,
              email: data.user.email,
              phone: data.user.phone,
            },
            role,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
          });
        } catch (err: unknown) {
          if ((err as { __adminGate?: boolean })?.__adminGate) {
            set({ error: ADMIN_GATE_ERROR });
            throw err;
          }
          const message = getErrorMessage(err, "Login failed");
          set({ error: message });
          throw err;
        } finally {
          set({ isLoading: false });
        }
      },

      // Revokes the session on the backend and clears auth state.
      logoutAction: async () => {
        const { accessToken } = get();
        set({ isLoading: true });
        try {
          if (accessToken) {
            await api.delete("/user/logout");
          }
        } catch (err: unknown) {
          console.error("Logout error on server:", err);
        } finally {
          set({
            user: null,
            role: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      // Fetches the signed-in admin's profile details.
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

      // Resets the store error message.
      clearError: () => set({ error: null }),

      // Local auth state cleanup without a backend call.
      logout: () =>
        set({
          user: null,
          role: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        }),
    }),
    {
      name: "cinematrix-admin-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user
          ? {
              name: state.user.name,
              email: state.user.email,
              phone: state.user.phone,
            }
          : null,
        role: state.role,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
