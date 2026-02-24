// FILE: server/src/routes/tenant.routes.ts
import { Router } from "express";

import { requireAuth } from "../middlewares/requireAuth";
import { resolveTenant } from "../middlewares/resolveTenant";
import { tenantResolve } from "../middlewares/tenantResolve";
import { requireTenantMembership } from "../middlewares/requireTenantMembership";
import { requireTenantRole } from "../middlewares/requireTenantRole";

import {
  createProjectHandler,
  getProjectHandler,
  listProjectsHandler,
  updateProjectHandler,
  deleteProjectHandler,
} from "../controllers/projects.controller";

import {
  listTenantMembersHandler,
  getMyTenantContextHandler,
  listTenantMembers,
  updateTenantMemberRole,
  removeTenantMember,
} from "../controllers/memberships.controller";

import {
  createInviteHandler,
  listInvitesHandler,
  revokeInviteHandler,
  acceptInviteHandler, // ✅ merged here
} from "../controllers/invites.controller";

import { getTenantAnalytics } from "../controllers/analytics.controller";

import {
  getTenantSettingsHandler,
  patchTenantSettingsHandler,
} from "../controllers/tenantSettings.controller";

const router = Router();

/**
 * ✅ Accept invite (logged-in user, NOT yet a tenant member)
 * MUST be before the protected /t/:tenantSlug router.
 */
router.post(
  "/t/:tenantSlug/invites/accept",
  requireAuth,
  resolveTenant,
  acceptInviteHandler
);

/* =========================================================
   1) Slug-based tenant routes (protected)
   Base: /api/t/:tenantSlug/...
   Chain: requireAuth → resolveTenant → requireTenantMembership
========================================================= */
const tenantSlugRouter = Router({ mergeParams: true });

router.use(
  "/t/:tenantSlug",
  requireAuth,
  resolveTenant,
  requireTenantMembership,
  tenantSlugRouter
);

// Projects
tenantSlugRouter.get("/projects", listProjectsHandler);
tenantSlugRouter.get("/projects/:projectId", getProjectHandler);

tenantSlugRouter.post("/projects", requireTenantRole(["tenantAdmin"]), createProjectHandler);

tenantSlugRouter.patch("/projects/:projectId", requireTenantRole(["tenantAdmin"]), updateProjectHandler);

tenantSlugRouter.delete("/projects/:projectId", requireTenantRole(["tenantAdmin"]), deleteProjectHandler);

// Members (legacy Phase 5 minimal)
tenantSlugRouter.get("/members", requireTenantRole(["tenantAdmin"]), listTenantMembersHandler);

// Tenant context (role)
tenantSlugRouter.get("/me", getMyTenantContextHandler);

/* =========================================================
   2) tenantId-based tenant routes (protected)
   Base: /api/tenant/:tenantId/...
   Chain: requireAuth → tenantResolve → requireTenantMembership
========================================================= */
const tenantIdRouter = Router({ mergeParams: true });

router.use(
  "/tenant/:tenantId",
  requireAuth,
  tenantResolve,
  requireTenantMembership,
  tenantIdRouter
);

// Analytics
tenantIdRouter.get("/analytics", requireTenantRole(["tenantAdmin"]), getTenantAnalytics);

// Members Management
tenantIdRouter.get("/members", requireTenantRole(["tenantAdmin"]), listTenantMembers);
tenantIdRouter.patch("/members/:userId", requireTenantRole(["tenantAdmin"]), updateTenantMemberRole);
tenantIdRouter.delete("/members/:userId", requireTenantRole(["tenantAdmin"]), removeTenantMember);

// Invites
tenantIdRouter.post("/invites", requireTenantRole(["tenantAdmin"]), createInviteHandler);
tenantIdRouter.get("/invites", requireTenantRole(["tenantAdmin"]), listInvitesHandler);
tenantIdRouter.delete("/invites/:inviteId", requireTenantRole(["tenantAdmin"]), revokeInviteHandler);

// Settings
tenantIdRouter.get("/settings", requireTenantRole(["tenantAdmin"]), getTenantSettingsHandler);
tenantIdRouter.patch("/settings", requireTenantRole(["tenantAdmin"]), patchTenantSettingsHandler);

export default router;

