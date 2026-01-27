// FILE: client/src/api/http.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "../store/auth.store";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const http = axios.create({
  baseURL,
  withCredentials: true, // needed for refresh-cookie auth
});

// Attach access token to every request if present
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh-once flow for 401s (expired access token)
// Assumes POST /auth/refresh sets/uses refresh cookie and returns { accessToken, user? }
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post(
      `${baseURL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const nextToken = data?.accessToken ?? null;
    if (nextToken) useAuthStore.getState().setAccessToken(nextToken);
    if (data?.user) useAuthStore.getState().setUser(data.user);
    return nextToken;
  } catch {
    useAuthStore.getState().clearAuth();
    return null;
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const status = error.response?.status;
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!original) throw error;
    if (status !== 401) throw error;
    if (original._retry) throw error;

    original._retry = true;

    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken().finally(() => {
        isRefreshing = false;
      });
    }

    const newToken = await refreshPromise;
    if (!newToken) throw error;

    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${newToken}`;
    return http.request(original);
  }
);
