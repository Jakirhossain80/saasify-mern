// FILE: server/src/middlewares/requirePlatformAdmin.ts
import type { Request, Response, NextFunction } from "express";

/**
 * Phase 5: Platform-only guard
 * Requires requireAuth to have already set req.user
 */
export function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  const role = req.user?.platformRole;

  if (role !== "platformAdmin") {
    return res.status(403).json({ code: "FORBIDDEN", message: "Platform admin only" });
  }

  return next();
}
