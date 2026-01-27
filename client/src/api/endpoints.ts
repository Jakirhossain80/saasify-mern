// FILE: client/src/api/endpoints.ts
export const API = {
  auth: {
    login: "/auth/login",
    refresh: "/auth/refresh",
    logout: "/auth/logout",
    me: "/auth/me",
  },
  platform: {
    tenants: "/platform/tenants",
  },
  tenant: {
    projects: (tenantSlug: string) => `/t/${tenantSlug}/projects`,
    // later: memberships/invites/audit-logs/saved-views...
  },
} as const;
