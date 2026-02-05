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
    config.headers = {
      ...(config.headers ?? {}),
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

// -------- Refresh-once flow for 401s --------
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

// Safely clear auth no matter what your store function name is
function clearAuthSafely() {
  const store: any = useAuthStore.getState();

  if (typeof store.clearAuth === "function") store.clearAuth();
  else if (typeof store.clear === "function") store.clear();
  else {
    // fallback (in case you rename things later)
    if (typeof store.setAccessToken === "function") store.setAccessToken(null);
    if (typeof store.setUser === "function") store.setUser(null);
  }
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    // Use bare axios to avoid interceptor recursion
    const { data } = await axios.post(
      `${baseURL}/auth/refresh`,
      {},
      { withCredentials: true }
    );

    const nextToken = data?.accessToken ?? null;

    if (nextToken && typeof useAuthStore.getState().setAccessToken === "function") {
      useAuthStore.getState().setAccessToken(nextToken);
    }
    if (data?.user && typeof useAuthStore.getState().setUser === "function") {
      useAuthStore.getState().setUser(data.user);
    }

    return nextToken;
  } catch {
    clearAuthSafely();
    return null;
  }
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<any>) => {
    const status = error.response?.status;

    const original =
      error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (!original) throw error;

    // Only handle 401
    if (status !== 401) throw error;

    // Prevent infinite retry
    if (original._retry) throw error;

    // Don't attempt refresh for auth endpoints (avoid loops)
    const url = String(original.url ?? "");

    const isAuthCall =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout");

    if (isAuthCall) {
      clearAuthSafely();
      throw error;
    }

    original._retry = true;

    if (!isRefreshing) {
      isRefreshing = true;

      refreshPromise = refreshAccessToken()
        .finally(() => {
          isRefreshing = false;
          refreshPromise = null; // ✅ important cleanup
        });
    }

    const newToken = await refreshPromise;

    // If refresh failed -> user must sign in again
    if (!newToken) {
      clearAuthSafely();
      throw error;
    }

    // Retry original request with new token
    original.headers = {
      ...(original.headers ?? {}),
      Authorization: `Bearer ${newToken}`,
    };

    return http.request(original);
  }
);
