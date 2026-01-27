// FILE: client/src/store/auth.store.ts
import { create } from "zustand";
import type { AuthUser } from "../types/auth.types";

type AuthState = {
  accessToken: string | null;
  user: AuthUser | null;
  isBootstrapped: boolean; // helps avoid guard flicker on first load

  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  setBootstrapped: (v: boolean) => void;

  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isBootstrapped: false,

  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  setBootstrapped: (v) => set({ isBootstrapped: v }),

  clearAuth: () => set({ accessToken: null, user: null }),
}));
