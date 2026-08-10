import axios from "axios";
import { useUserStore } from "../stores/user.store";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Attach the stored access token to every outgoing request.
api.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// On an expired/invalid access token, clear auth state so the route
// guard redirects back to the login page.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useUserStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

export default api;
