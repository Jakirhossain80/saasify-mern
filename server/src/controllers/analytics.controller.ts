// FILE: server/src/controllers/analytics.controller.ts
import type { Request, Response, NextFunction } from "express";
import { getPlatformAnalyticsService } from "../services/analytics.service";

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
