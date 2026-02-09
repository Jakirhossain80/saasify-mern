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

// Members (legacy Phase 5 minimal)
tenantSlugRouter.get(
  "/members",
  requireTenantRole(["tenantAdmin"]),
  listTenantMembersHandler
);

// Tenant context (role)
tenantSlugRouter.get("/me", getMyTenantContextHandler);

/* =========================================================
   2) tenantId-based tenant routes (KEEP existing + ADD Analytics)
   Base: /api/tenant/:tenantId/...
   MUST USE CHAIN:
   requireAuth → tenantResolve → requireTenantMembership → requireTenantRole(["tenantAdmin"])
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
 *
 * Middleware chain (effective):
 * requireAuth → tenantResolve → requireTenantMembership → requireTenantRole(["tenantAdmin"])
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
 *
 * Middleware chain (effective):
 * requireAuth → tenantResolve → requireTenantMembership → requireTenantRole(["tenantAdmin"])
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

export default router;
