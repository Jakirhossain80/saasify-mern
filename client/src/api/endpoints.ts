// FILE: client/src/api/endpoints.ts
export const API = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  platform: {
    // base route (pass pagination/search via axios `params`)
    tenants: "/platform/tenants",
  },
  tenant: {
    projects: (tenantSlug: string) => `/t/${tenantSlug}/projects`,
  },
} as const;
