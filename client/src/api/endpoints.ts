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
    tenants: "/platform/tenants",
    archiveTenant: (tenantId: string) => `/platform/tenants/${tenantId}/archive`,
    unarchiveTenant: (tenantId: string) => `/platform/tenants/${tenantId}/unarchive`,
    deleteTenant: (tenantId: string) => `/platform/tenants/${tenantId}`,
    suspendTenant: (tenantId: string) => `/platform/tenants/${tenantId}/suspend`,
    softDeleteTenant: (tenantId: string) => `/platform/tenants/${tenantId}/soft`,
    assignTenantAdmin: (tenantId: string) => `/platform/tenants/${tenantId}/admins`,
    analytics: "/platform/analytics",
    auditLogs: "/platform/audit-logs",
  },

  tenant: {
    projects: (tenantSlug: string) => `/t/${tenantSlug}/projects`,
    me: (tenantSlug: string) => `/t/${tenantSlug}/me`,

    // ✅ NEW: invite acceptance route (slug-based, pre-membership)
    acceptInvite: (tenantSlug: string) => `/t/${tenantSlug}/invites/accept`,

    members: (tenantId: string) => `/tenant/${tenantId}/members`,
    memberByUser: (tenantId: string, userId: string) =>
      `/tenant/${tenantId}/members/${userId}`,

    invites: (tenantId: string) => `/tenant/${tenantId}/invites`,
    inviteById: (tenantId: string, inviteId: string) =>
      `/tenant/${tenantId}/invites/${inviteId}`,

    analytics: (tenantId: string) => `/tenant/${tenantId}/analytics`,
    settings: (tenantId: string) => `/tenant/${tenantId}/settings`,
  },
} as const;
