// FILE: server/src/routes/tenant.routes.ts
import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { resolveTenant } from "../middlewares/resolveTenant";
import {
  createProjectHandler,
  getProjectHandler,
  listProjectsHandler,
} from "../controllers/projects.controller";

const router = Router();

// Tenant-scoped router (merge params so sub-router can read :tenantSlug)
const tenantRouter = Router({ mergeParams: true });

/**
 * Phase 4:
 * - requireAuth: user must be authenticated (Phase 3)
 * - resolveTenant: slug → tenantId and attach req.tenantId
 * - No RBAC/membership checks yet (Phase 5)
 */
router.use("/t/:tenantSlug", requireAuth, resolveTenant, tenantRouter);

// Projects (minimal sample endpoints for Phase-4 verification)
tenantRouter.get("/projects", listProjectsHandler);
tenantRouter.get("/projects/:projectId", getProjectHandler);
tenantRouter.post("/projects", createProjectHandler);

export default router;
