import { create } from "zustand";
import { isAxiosError } from "axios";
import {
  type IScreeningTemplate,
  type CreateTemplatePayload,
  type UpdateTemplatePayload,
  type TemplateMutationResponse,
  type FetchTemplatesResponse,
} from "../types/template.type";
import api from "../services/api";

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

interface TemplateState {
  templates: IScreeningTemplate[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  getTemplatesAction: () => Promise<void>;
  createTemplateAction: (payload: CreateTemplatePayload) => Promise<void>;
  updateTemplateAction: (
    id: string,
    payload: UpdateTemplatePayload,
  ) => Promise<void>;
  deleteTemplateAction: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTemplateStore = create<TemplateState>()((set) => ({
  templates: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  // Fetches screening templates for the signed-in partner's cinemas.
  getTemplatesAction: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.get<FetchTemplatesResponse>(
        "/template",
      );
      set({ templates: data.templates });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to fetch templates");
      set({ error: message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  // Creates a new screening template for one of the managed cinemas.
  createTemplateAction: async (payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const { data } = await api.post<TemplateMutationResponse>(
        "/template",
        payload,
      );
      set((state) => ({
        templates: [data.template, ...state.templates],
      }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to create template");
      set({ error: message });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Updates an existing screening template.
  updateTemplateAction: async (id, payload) => {
    set({ isSubmitting: true, error: null });
    try {
      const { data } = await api.patch<TemplateMutationResponse>(
        `/template/${id}`,
        payload,
      );
      set((state) => ({
        templates: state.templates.map((t) => (t._id === id ? data.template : t)),
      }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to update template");
      set({ error: message });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  // Deletes a screening template by ID.
  deleteTemplateAction: async (id: string) => {
    set({ isSubmitting: true, error: null });
    try {
      await api.delete<{ message: string }>(`/template/${id}`);
      set((state) => ({
        templates: state.templates.filter((t) => t._id !== id),
      }));
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to delete template");
      set({ error: message });
      throw err;
    } finally {
      set({ isSubmitting: false });
    }
  },

  clearError: () => set({ error: null }),
}));
