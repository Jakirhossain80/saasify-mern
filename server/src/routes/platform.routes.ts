// FILE: server/src/routes/platform.routes.ts
import { Router } from "express";

import { requireAuth } from "../middlewares/requireAuth";
import { requirePlatformAdmin } from "../middlewares/requirePlatformAdmin";

import {
  getTenantDetailsHandler,
  listAllTenantsHandler,
  setTenantSuspendedHandler,
  softDeleteTenantHandler,
} from "../controllers/tenants.controller";

const router = Router();

/**
 * Platform routes (Phase 5+):
 * - requireAuth: valid access token (Bearer)
 * - requirePlatformAdmin: platformAdmin only
 *
 * NOTE:
 * We attach guards once for the whole /platform namespace to keep routes clean and consistent.
 */
router.use("/platform", requireAuth, requirePlatformAdmin);

/**
 * Module 1: Tenants (platform)
 */
router.get("/platform/tenants", listAllTenantsHandler);
router.get("/platform/tenants/:tenantId", getTenantDetailsHandler);
router.patch("/platform/tenants/:tenantId/suspend", setTenantSuspendedHandler);
router.delete("/platform/tenants/:tenantId", softDeleteTenantHandler);

export default router;
