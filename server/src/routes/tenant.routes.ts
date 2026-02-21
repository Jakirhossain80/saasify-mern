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
  // ✅ ADD (for archive/unarchive + title/description update)
  updateProjectHandler,
  // ✅ ADD (soft delete)
  deleteProjectHandler,
} from "../controllers/projects.controller";

import {
  // ✅ existing handlers (keep)
  listTenantMembersHandler,
  getMyTenantContextHandler,
  // ✅ Phase 8 (2) new handlers (add)
  listTenantMembers,
  updateTenantMemberRole,
  removeTenantMember,
} from "../controllers/memberships.controller";

import {
  createInviteHandler,
  listInvitesHandler,
  revokeInviteHandler,
} from "../controllers/invites.controller";

import { getTenantAnalytics } from "../controllers/analytics.controller";

// ✅ Phase 8 (4) Tenant Settings handlers (ADD)
import {
  getTenantSettingsHandler,
  patchTenantSettingsHandler,
} from "../controllers/tenantSettings.controller";

const router = Router();

/* =========================================================
   1) EXISTING slug-based tenant routes (KEEP AS-IS)
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

tenantSlugRouter.post(
  "/projects",
  requireTenantRole(["tenantAdmin"]),
  createProjectHandler
);

// ✅ ADD: Update (archive/unarchive + title/description)
tenantSlugRouter.patch(
  "/projects/:projectId",
  requireTenantRole(["tenantAdmin"]),
  updateProjectHandler
);

// ✅ ADD: Delete (soft delete)
tenantSlugRouter.delete(
  "/projects/:projectId",
  requireTenantRole(["tenantAdmin"]),
  deleteProjectHandler
);

// Members (legacy Phase 5 minimal)
tenantSlugRouter.get(
  "/members",
  requireTenantRole(["tenantAdmin"]),
  listTenantMembersHandler
);

// Tenant context (role)
tenantSlugRouter.get("/me", getMyTenantContextHandler);

/* =========================================================
   2) tenantId-based tenant routes (KEEP existing + ADD Settings)
   Base: /api/tenant/:tenantId/...
   MUST USE CHAIN:
   requireAuth → tenantResolve → requireTenantMembership
========================================================= */
const tenantIdRouter = Router({ mergeParams: true });

router.use(
  "/tenant/:tenantId",
  requireAuth,
  tenantResolve,
  requireTenantMembership,
  tenantIdRouter
);

/**
 * ✅ Tenant Analytics Stats (Phase 8 (3)) — tenantAdmin recommended
 * GET /api/tenant/:tenantId/analytics
 */
tenantIdRouter.get(
  "/analytics",
  requireTenantRole(["tenantAdmin"]),
  getTenantAnalytics
);

/**
 * ✅ Members Management (Phase 8 (2)) — tenantAdmin only
 * Endpoints:
 * - GET    /api/tenant/:tenantId/members
 * - PATCH  /api/tenant/:tenantId/members/:userId
 * - DELETE /api/tenant/:tenantId/members/:userId
 */
tenantIdRouter.get(
  "/members",
  requireTenantRole(["tenantAdmin"]),
  listTenantMembers
);

tenantIdRouter.patch(
  "/members/:userId",
  requireTenantRole(["tenantAdmin"]),
  updateTenantMemberRole
);

tenantIdRouter.delete(
  "/members/:userId",
  requireTenantRole(["tenantAdmin"]),
  removeTenantMember
);

// Invites (tenantAdmin only) — KEEP AS-IS
tenantIdRouter.post(
  "/invites",
  requireTenantRole(["tenantAdmin"]),
  createInviteHandler
);

tenantIdRouter.get(
  "/invites",
  requireTenantRole(["tenantAdmin"]),
  listInvitesHandler
);

tenantIdRouter.delete(
  "/invites/:inviteId",
  requireTenantRole(["tenantAdmin"]),
  revokeInviteHandler
);

/**
 * ✅ Tenant Settings (Phase 8 (4)) — tenantAdmin only
 * Endpoints:
 * - GET   /api/tenant/:tenantId/settings
 * - PATCH /api/tenant/:tenantId/settings
 *
 * Effective chain:
 * requireAuth → tenantResolve → requireTenantMembership → requireTenantRole(["tenantAdmin"])
 */
tenantIdRouter.get(
  "/settings",
  requireTenantRole(["tenantAdmin"]),
  getTenantSettingsHandler
);

tenantIdRouter.patch(
  "/settings",
  requireTenantRole(["tenantAdmin"]),
  patchTenantSettingsHandler
);

export default router; 
