// FILE: server/src/routes/platform.routes.ts
import { Router } from "express";

import { requireAuth } from "../middlewares/requireAuth";
import { requirePlatformAdmin } from "../middlewares/requirePlatformAdmin";

import {
  createTenantHandler,
  getTenantDetailsHandler,
  listAllTenantsHandler,

  // Legacy / existing
  setTenantSuspendedHandler,
  softDeleteTenantHandler,

  // ✅ Feature #2
  archiveTenantHandler,
  unarchiveTenantHandler,
  safeDeleteTenantHandler,
} from "../controllers/tenants.controller";

import { assignTenantAdminController } from "../controllers/memberships.controller";

// ✅ Feature #4
import { getPlatformAnalyticsHandler } from "../controllers/analytics.controller";

// ✅ Feature #5
import { listPlatformAuditLogsHandler } from "../controllers/auditLogs.controller";

const router = Router();

/**
 * ✅ IMPORTANT:
 * This router should be mounted in app.ts like:
 * app.use("/api", platformRoutes)
 *
 * So inside this file we define routes as "/platform/..."
 * and we attach guards once for the whole platform namespace.
 */
router.use("/platform", requireAuth, requirePlatformAdmin);

/**
 * =========================
 * Module 1: Tenants (platform)
 * =========================
 */

// ✅ Create tenant
router.post("/platform/tenants", createTenantHandler);

// ✅ List tenants
router.get("/platform/tenants", listAllTenantsHandler);

// ✅ Tenant details
router.get("/platform/tenants/:tenantId", getTenantDetailsHandler);

/**
 * =========================
 * Legacy / Backward-compatible
 * =========================
 * Suspend/unsuspend (maps to isArchived)
 * Keep this if your UI or old Postman collections still use it.
 */
router.patch("/platform/tenants/:tenantId/suspend", setTenantSuspendedHandler);

/**
 * Soft delete (sets deletedAt + deletedByUserId + archives tenant)
 * Keep this if your project already uses soft delete flow.
 */
router.delete("/platform/tenants/:tenantId/soft", softDeleteTenantHandler);

/**
 * =========================
 * ✅ Feature #2: Archive / Unarchive
 * =========================
 */
router.patch("/platform/tenants/:tenantId/archive", archiveTenantHandler);
router.patch("/platform/tenants/:tenantId/unarchive", unarchiveTenantHandler);

/**
 * ✅ Feature #2: Safe delete (hard delete only if no projects/memberships)
 * This is the recommended DELETE behavior.
 */
router.delete("/platform/tenants/:tenantId", safeDeleteTenantHandler);

/**
 * =========================
 * ✅ Feature #3: Assign Tenant Admins (Membership Records)
 * =========================
 * POST /api/platform/tenants/:tenantId/admins
 * body: { "email": "admin@tenant.com" }
 */
router.post("/platform/tenants/:tenantId/admins", assignTenantAdminController);

/**
 * =========================
 * ✅ Feature #4: Platform Analytics
 * =========================
 * GET /api/platform/analytics
 */
router.get("/platform/analytics", getPlatformAnalyticsHandler);

/**
 * =========================
 * ✅ Feature #5: Platform Audit Logs
 * =========================
 * GET /api/platform/audit-logs?page=1&limit=20&action=TENANT_CREATED
 */
router.get("/platform/audit-logs", listPlatformAuditLogsHandler);

export default router;
