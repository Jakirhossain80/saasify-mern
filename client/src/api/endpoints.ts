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

    // ✅ Feature #2: Archive / Unarchive / Safe Delete
    archiveTenant: (tenantId: string) => `/platform/tenants/${tenantId}/archive`,
    unarchiveTenant: (tenantId: string) => `/platform/tenants/${tenantId}/unarchive`,
    deleteTenant: (tenantId: string) => `/platform/tenants/${tenantId}`,

    // ✅ Optional legacy endpoint (only if you still use it in UI/Postman)
    suspendTenant: (tenantId: string) => `/platform/tenants/${tenantId}/suspend`,

    // ✅ Optional legacy soft-delete endpoint (only if you keep it)
    softDeleteTenant: (tenantId: string) => `/platform/tenants/${tenantId}/soft`,

    // ✅ Feature #3: Assign Tenant Admin (Membership upsert)
    assignTenantAdmin: (tenantId: string) => `/platform/tenants/${tenantId}/admins`,

    // ✅ Feature #4: Platform Analytics
    analytics: "/platform/analytics",

    // ✅ Feature #5: Audit Logs
    auditLogs: "/platform/audit-logs",
  },

  tenant: {
    // ✅ Projects (slug based)
    projects: (tenantSlug: string) => `/t/${tenantSlug}/projects`,

    // ✅ Tenant context (role) for selected tenant
    // Backend: GET /api/t/:tenantSlug/me  (baseURL already includes /api)
    me: (tenantSlug: string) => `/t/${tenantSlug}/me`,

    // ✅ Members management (tenantId based)
    members: (tenantId: string) => `/tenant/${tenantId}/members`,
    memberByUser: (tenantId: string, userId: string) =>
      `/tenant/${tenantId}/members/${userId}`,

    // ✅ Phase 8 (Invites): Tenant Invites (tenantId based)
    invites: (tenantId: string) => `/tenant/${tenantId}/invites`,
    inviteById: (tenantId: string, inviteId: string) =>
      `/tenant/${tenantId}/invites/${inviteId}`,

    // ✅ Phase 8 (3): Tenant Analytics Stats
    analytics: (tenantId: string) => `/tenant/${tenantId}/analytics`,

    // ✅ Phase 8 (4): Tenant Settings (tenantId based)
    settings: (tenantId: string) => `/tenant/${tenantId}/settings`,
  },
} as const;
