// FILE: server/src/routes/tenant.routes.ts
import { Router } from "express";

import { requireAuth } from "../middlewares/requireAuth";
import { resolveTenant } from "../middlewares/resolveTenant";
import { requireTenantMembership } from "../middlewares/requireTenantMembership";
import { requireTenantRole } from "../middlewares/requireTenantRole";

import {
  createProjectHandler,
  getProjectHandler,
  listProjectsHandler,
} from "../controllers/projects.controller";
import { listTenantMembersHandler, getMyTenantContextHandler } from "../controllers/memberships.controller";


const router = Router();

// Merge params so child router can read :tenantSlug
const tenantRouter = Router({ mergeParams: true });

/**
 * Tenant base (Phase 4 + Phase 5):
 * - requireAuth: must have valid access token
 * - resolveTenant: tenantSlug -> tenantId + attach req.tenantId/req.tenantSlug
 * - requireTenantMembership: must be an ACTIVE member of this tenant
 */
router.use(
  "/t/:tenantSlug",
  requireAuth,
  resolveTenant,
  requireTenantMembership,
  tenantRouter
);

/**
 * Projects:
 * - tenant members can LIST/GET
 * - tenant admins only can CREATE
 */
tenantRouter.get("/projects", listProjectsHandler);
tenantRouter.get("/projects/:projectId", getProjectHandler);
tenantRouter.post("/projects", requireTenantRole(["tenantAdmin"]), createProjectHandler);

/**
 * Membership management (minimal example):
 * - tenant admins only
 */
tenantRouter.get("/members", requireTenantRole(["tenantAdmin"]), listTenantMembersHandler);
tenantRouter.get("/me", getMyTenantContextHandler);

export default router;
