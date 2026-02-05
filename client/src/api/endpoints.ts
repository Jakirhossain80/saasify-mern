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
    // Matches: router.patch("/platform/tenants/:tenantId/suspend", ...)
    suspendTenant: (tenantId: string) => `/platform/tenants/${tenantId}/suspend`,

    // ✅ Optional legacy soft-delete endpoint (only if you keep it)
    // Matches: router.delete("/platform/tenants/:tenantId/soft", ...)
    softDeleteTenant: (tenantId: string) => `/platform/tenants/${tenantId}/soft`,

    // ✅ Feature #3: Assign Tenant Admin (Membership upsert)
    assignTenantAdmin: (tenantId: string) => `/platform/tenants/${tenantId}/admins`,

    // ✅ Feature #4: Platform Analytics
    analytics: "/platform/analytics",

    // ✅ Feature #5: Audit Logs
    auditLogs: "/platform/audit-logs",
  },

  tenant: {
    projects: (tenantSlug: string) => `/t/${tenantSlug}/projects`,
  },
} as const;
