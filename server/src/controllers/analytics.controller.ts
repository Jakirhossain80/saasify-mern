// FILE: server/src/controllers/analytics.controller.ts
import type { Request, Response, NextFunction } from "express";
import {
  getPlatformAnalyticsService,
  getTenantAnalyticsStats,
} from "../services/analytics.service";

/**
 * GET /api/platform/analytics
 * PlatformAdmin only (route-level guards applied in platform.routes.ts).
 */
export async function getPlatformAnalyticsHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const stats = await getPlatformAnalyticsService();
    return res.status(200).json(stats);
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/tenant/:tenantId/analytics
 * Tenant dashboard analytics cards:
 * - activeProjects
 * - archivedProjects
 * - membersCount
 *
 * Guards should be applied at route-level (tenant.routes.ts):
 * requireAuth → tenantResolve → requireTenantMembership → requireTenantRole("tenantAdmin")
 */
export async function getTenantAnalytics(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { tenantId } = req.params;

    const stats = await getTenantAnalyticsStats(tenantId);

    return res.status(200).json(stats);
  } catch (err) {
    return next(err);
  }
}
