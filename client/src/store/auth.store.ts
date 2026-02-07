// FILE: client/src/store/auth.store.ts
import { create } from "zustand";
import type { AuthUser } from "../types/auth.types";

/**
 * Tenant roles are separate from platform roles.
 * platformRole lives in AuthUser (platformAdmin | user)
 * tenant role is derived from Membership for the selected tenant.
 */
export type TenantRole = "tenantAdmin" | "member";

type AuthState = {
  // Auth
  accessToken: string | null;
  user: AuthUser | null;

  /**
   * Helps avoid guard flicker on first load:
   * - false: still checking / bootstrapping session
   * - true: done checking (user may be null or not)
   */
  isBootstrapped: boolean;

  // ✅ Tenant context (for slug-based routing + tenant UI gating)
  activeTenantSlug: string | null;
  activeTenantRole: TenantRole | null;

  // setters
  setAccessToken: (token: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  setBootstrapped: (v: boolean) => void;

  setActiveTenantSlug: (slug: string | null) => void;
  setActiveTenantRole: (role: TenantRole | null) => void;

  // helpers
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  // Auth
  accessToken: null,
  user: null,
  isBootstrapped: false,

  // Tenant context
  activeTenantSlug: null,
  activeTenantRole: null,

  // setters
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  setBootstrapped: (v) => set({ isBootstrapped: v }),

  // ✅ Persist tenant slug so refresh/direct URL works consistently
  setActiveTenantSlug: (slug) => {
    if (slug) localStorage.setItem("activeTenantSlug", slug);
    else localStorage.removeItem("activeTenantSlug");
    set({ activeTenantSlug: slug });
  },

  setActiveTenantRole: (role) => set({ activeTenantRole: role }),

  /**
   * Clear everything (auth + tenant context).
   * IMPORTANT: keep isBootstrapped as-is, otherwise guards can get stuck
   * showing "Checking permissions…" until bootstrap runs again.
   */
  clearAuth: () =>
    set({
      accessToken: null,
      user: null,
      activeTenantSlug: null,
      activeTenantRole: null,
    }),
}));
