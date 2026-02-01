// FILE: server/src/routes/platform.routes.ts
import { Router } from "express";

import { requireAuth } from "../middlewares/requireAuth";
import { requirePlatformAdmin } from "../middlewares/requirePlatformAdmin";

import {
  createTenantHandler,
  getTenantDetailsHandler,
  listAllTenantsHandler,
  setTenantSuspendedHandler,
  softDeleteTenantHandler,
} from "../controllers/tenants.controller";

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
 * Module 1: Tenants (platform)
 */

// ✅ Create tenant
router.post("/platform/tenants", createTenantHandler);

// List tenants
router.get("/platform/tenants", listAllTenantsHandler);

// Tenant details
router.get("/platform/tenants/:tenantId", getTenantDetailsHandler);

// Suspend/unsuspend (maps to isArchived)
router.patch("/platform/tenants/:tenantId/suspend", setTenantSuspendedHandler);

// Soft delete
router.delete("/platform/tenants/:tenantId", softDeleteTenantHandler);

export default router;
