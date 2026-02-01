// FILE: server/src/middlewares/requirePlatformAdmin.ts
import type { Request, Response, NextFunction } from "express";

/**
 * Platform-only guard
 * Requires requireAuth to have already set req.user (including platformRole)
 */
export function requirePlatformAdmin(req: Request, res: Response, next: NextFunction) {
  const role = req.user?.platformRole;

  // If requireAuth didn't run or didn't attach role properly
  if (!role) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  if (role !== "platformAdmin") {
    return res.status(403).json({ code: "FORBIDDEN", message: "Platform admin only" });
  }

  return next();
}
